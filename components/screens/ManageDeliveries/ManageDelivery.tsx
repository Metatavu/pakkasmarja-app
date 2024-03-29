import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryListItem, KeyboardType, BoxKey, DeliveryNoteData } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight, Platform, Dimensions, Alert } from "react-native";
import { Delivery, Product, DeliveryNote, DeliveryPlace, ItemGroupCategory, ProductPrice, DeliveryQuality, Contact, ContractQuantities } from "pakkasmarja-client";
import { Text, Icon, Input, ListItem, CheckBox, Body, Card, CardItem } from "native-base";
import NumericInput from 'react-native-numeric-input'
import moment from "moment"
import PakkasmarjaApi from "../../../api";
import FeatherIcon from "react-native-vector-icons/Feather";
import ModalSelector from 'react-native-modal-selector';
import IconPen from "react-native-vector-icons/EvilIcons";
import DateTimePicker from "react-native-modal-datetime-picker";
import EntypoIcon from "react-native-vector-icons/Entypo";
import { styles } from "../deliveries/styles.tsx";
import CreateDeliveryNoteModal from "../deliveries/CreateDeliveryNoteModal";
import ViewOrDeleteNoteModal from "../deliveries/ViewOrDeleteNoteModal";
import Autocomplete from 'native-base-autocomplete';
import DeliveryNoteModal from "../deliveries/DeliveryNoteModal";
import { FileService } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import AsyncButton from "../../generic/async-button";
import strings from "../../../localization/strings";
import { Picker } from "native-base";
import { extendMoment } from "moment-range";
import { filterPossibleDeliveryPlaces } from "../../../utils/utility-functions";
import ProfileButton from "../../layout/ProfileButton";

const Moment = require("moment");
const extendedMoment = extendMoment(Moment);
extendedMoment.locale("fi");

/**
 * Component props
 */
interface Props {
  navigation: any;
  route: any;
  accessToken?: AccessToken;
};

/**
 * Component state
 */
interface State {
  deliveryQualities?: DeliveryQuality[]
  deliveryData?: DeliveryListItem;
  deliveryPlaces?: DeliveryPlace[];
  contacts?: Contact[];
  deliveryPlaceId?: string;
  deliveryQualityId?: string;
  products: Product[];
  productId?: string;
  datepickerVisible: boolean;
  modalOpen: boolean;
  loading: boolean;
  amount: number;
  selectedDate?: Date;
  deliveryNotes?: DeliveryNote[];
  createModal: boolean;
  editModal: boolean;
  deliveryNoteId?: string;
  productPrice?: ProductPrice;
  product?: Product;
  isNewDelivery?: boolean;
  category?: ItemGroupCategory;
  noteEditable: boolean;
  deliveryNoteData: DeliveryNoteData;
  deliveryNoteDatas: DeliveryNoteData[];
  deliveryNoteFile?: {
    fileUri: string;
    fileType: string;
  };
  redBoxesLoaned: number;
  redBoxesReturned: number;
  grayBoxesLoaned: number;
  grayBoxesReturned: number;
  orangeBoxesLoaned: number;
  orangeBoxesReturned: number;
  greenBoxesLoaned: number;
  greenBoxesReturned: number;
  query?: string;
  selectedContact?: Contact;
  contractQuantities?: ContractQuantities[];
  shouldMarkEquipmentInspected: boolean;
};

/**
 * Component for manage delivery
 */
class ManageDelivery extends React.Component<Props, State> {

  private contactDebounce?: NodeJS.Timeout;

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      datepickerVisible: false,
      modalOpen: false,
      amount: 0,
      products: [],
      createModal: false,
      editModal: false,
      deliveryQualities: [],

      noteEditable: false,
      deliveryNoteData: { text: "", imageType: "", imageUri: "" },
      deliveryNoteDatas: [],

      redBoxesLoaned: 0,
      redBoxesReturned: 0,
      grayBoxesLoaned: 0,
      grayBoxesReturned: 0,
      orangeBoxesLoaned: 0,
      orangeBoxesReturned: 0,
      greenBoxesLoaned: 0,
      greenBoxesReturned: 0,

      query: "",

      shouldMarkEquipmentInspected: false
    };
  }

  /**
   * Screen navigation options
   *
   * @param navigation navigation instance
   */
  private navigationOptions = (navigation: any) => ({
    headerStyle: {
      height: 100,
      backgroundColor: "#E51D2A"
    },
    headerTitle: () => <TopBar/>,
    headerTitleAlign: "center",
    headerTitleContainerStyle: { left: 0 },
    headerLeft: () => (
      <TouchableHighlight onPress={ navigation.goBack }>
        <FeatherIcon
          name="chevron-left"
          color="#fff"
          size={ 40 }
          style={{ marginLeft: 30 }}
        />
      </TouchableHighlight>
    ),
    headerRight: () => <ProfileButton/>
  });

  /**
   * Component did mount life cycle event
   */
  public componentDidMount = async () => {
    const { accessToken, navigation, route } = this.props;
    const { deliveryListItem, category, isNewDelivery } = route.params;

    navigation.setOptions(this.navigationOptions(navigation));

    if (!accessToken) return;

    this.setState({
      loading: true,
      isNewDelivery: isNewDelivery,
      category: category
    });

    const deliveryPlaces = await new PakkasmarjaApi()
      .getDeliveryPlacesService(accessToken.access_token)
      .listDeliveryPlaces();

    this.setState({ deliveryPlaces: filterPossibleDeliveryPlaces(deliveryPlaces, category) });

    await this.listProducts();

    if (isNewDelivery || !deliveryListItem) {
      this.setState({
        deliveryPlaceId: deliveryPlaces[0].id,
        amount: 0,
        loading: false
      });

      return;
    }

    const deliveryPlace = deliveryPlaces.find(deliveryPlace =>
      deliveryPlace.id === deliveryListItem.delivery.deliveryPlaceId
    );

    await this.fetchContractQuantities(deliveryListItem.product);

    this.setState({
      deliveryData: deliveryListItem,
      deliveryPlaceId: deliveryPlace?.id,
      amount: deliveryListItem.delivery.amount,
      selectedDate: new Date(deliveryListItem.delivery.time),
      selectedContact: deliveryListItem.contact,
      loading: false
    }, this.loadDeliveryNotes);
  }

  /**
   * Component did update life cycle event
   *
   * @param prevProps previous component properties
   * @param prevState previous component state
   */
  public componentDidUpdate = (prevProps: Props, prevState: State) => {
    if (prevState.selectedDate !== this.state.selectedDate || prevState.productId !== this.state.productId) {
      this.props.accessToken && this.getProductPrice();
    }

    if (prevState.selectedContact !== this.state.selectedContact) {
      this.listProducts();
    }
  }

  /**
   * List products
   */
  private listProducts = async () => {
    const { accessToken, route } = this.props;
    const { selectedContact } = this.state;
    const { deliveryListItem, category, isNewDelivery } = route.params;

    if (!accessToken) return;

    this.setState({
      products: [],
      productPrice: undefined
    });

    const Api = new PakkasmarjaApi();
    const productsService = Api.getProductsService(accessToken.access_token);
    const deliveryQualitiesService = Api.getDeliveryQualitiesService(accessToken.access_token);

    if (!isNewDelivery && deliveryListItem?.product && deliveryListItem.contact) {
      const deliveryProductId = deliveryListItem.product.id;

      const [ products, deliveryQualities ] = await Promise.all([
        productsService.listProducts(undefined, category, deliveryListItem.contact.id, undefined, 999),
        deliveryQualitiesService.listDeliveryQualities(category, deliveryProductId)
      ]);

      this.setState({
        productId: deliveryProductId,
        product: deliveryListItem.product,
        products: products,
        deliveryQualities: deliveryQualities
      }, this.getProductPrice);

      return;
    }

    if (!selectedContact) return;

    const products = await productsService.listProducts(undefined, category, selectedContact.id, undefined, 999);
    const selectedProduct = products.length ? products[0] : undefined;

    const [ deliveryQualities ] = await Promise.all([
      deliveryQualitiesService.listDeliveryQualities(category, selectedProduct?.id),
      this.fetchContractQuantities(selectedProduct)
    ]);

    this.setState({
      productId: selectedProduct?.id,
      product: selectedProduct,
      products: products,
      deliveryQualities
    }, this.getProductPrice);
  }

  private markContactEquipmentInspected = async () => {
    const { accessToken } = this.props;

    if (!accessToken?.access_token) return;

    const contactToUpdate = this.state.isNewDelivery
      ? this.state.selectedContact
      : this.state.deliveryData?.contact;

    if (!contactToUpdate?.id) return;

    await new PakkasmarjaApi()
      .getContactsService(accessToken.access_token)
      .updateContact(
        { ...contactToUpdate, equipmentInspected: true },
        contactToUpdate.id!
      );
  };

  /**
   * Handles accept delivery
   */
  private handleDeliveryAccept = async () => {
    const { accessToken, navigation } = this.props;
    const {
      isNewDelivery,
      product,
      deliveryPlaceId,
      selectedDate,
      amount,
      deliveryData,
      selectedContact,
      deliveryQualityId,
      deliveryNoteDatas,
      redBoxesLoaned,
      redBoxesReturned,
      grayBoxesLoaned,
      grayBoxesReturned,
      orangeBoxesLoaned,
      orangeBoxesReturned,
      greenBoxesLoaned,
      greenBoxesReturned,
      shouldMarkEquipmentInspected
    } = this.state;

    if (!accessToken || !product?.id || !deliveryPlaceId || !selectedDate) {
      return;
    }

    const delivery: Delivery = {
      id: isNewDelivery ? "" : deliveryData!.delivery.id,
      productId: product.id,
      userId: isNewDelivery ?
        selectedContact?.id ?? "" :
        deliveryData?.contact?.id ?? "",
      time: moment(selectedDate).utc().toDate(),
      status: "DONE",
      amount: amount,
      deliveryPlaceId: deliveryPlaceId,
      qualityId: deliveryQualityId,
      loans: [
        { item: "RED_BOX", loaned: redBoxesLoaned, returned: redBoxesReturned },
        { item: "GRAY_BOX", loaned: grayBoxesLoaned, returned: grayBoxesReturned },
        { item: "ORANGE_BOX", loaned: orangeBoxesLoaned, returned: orangeBoxesReturned },
        { item: "GREEN_BOX", loaned: greenBoxesLoaned, returned: greenBoxesReturned },
      ]
    }

    const deliveryService = new PakkasmarjaApi().getDeliveriesService(accessToken.access_token);

    if (isNewDelivery) {
      const createdDelivery: Delivery = await deliveryService.createDelivery({ ...delivery, status: "PROPOSAL" });

      if (deliveryNoteDatas.length && createdDelivery.id) {
        await Promise.all(
          deliveryNoteDatas.map(deliveryNote =>
            this.createDeliveryNote(createdDelivery.id || "", deliveryNote)
          )
        );
      }

      await deliveryService.updateDelivery({ ...createdDelivery, status: "DONE" }, createdDelivery.id!);
    } else {
      deliveryData && await deliveryService.updateDelivery(delivery, deliveryData.delivery.id!);
    }

    if (shouldMarkEquipmentInspected) {
      await this.markContactEquipmentInspected();
    }

    navigation.navigate("ManageDeliveries");
  }

  /**
   * Handles delivery reject
   */
  private handleDeliveryReject = async () => {
    const { accessToken, navigation } = this.props;
    const {
      product,
      deliveryPlaceId,
      deliveryData,
      deliveryQualities,
      amount,
      deliveryQualityId,
      selectedDate,
      shouldMarkEquipmentInspected
    } = this.state;

    if (
      !accessToken ||
      !product?.id ||
      !deliveryPlaceId ||
      !deliveryData?.product ||
      !deliveryData.delivery.id ||
      !deliveryQualities
    ) {
      return;
    }

    await new PakkasmarjaApi()
      .getDeliveriesService(accessToken.access_token)
      .updateDelivery(
        {
          id: deliveryData.delivery.id,
          productId: product.id,
          userId: accessToken.userId,
          time: moment(selectedDate).utc().toDate(),
          status: "NOT_ACCEPTED",
          amount: amount,
          deliveryPlaceId: deliveryPlaceId,
          qualityId: deliveryQualityId
        },
        deliveryData.delivery.id
      );

    if (shouldMarkEquipmentInspected) {
      await this.markContactEquipmentInspected();
    }

    navigation.navigate("ManageDeliveries");
  }

  /**
   * Load delivery notes
   */
  private loadDeliveryNotes = async () => {
    const { accessToken } = this.props;
    const { deliveryData } = this.state;

    if (!accessToken || !deliveryData?.delivery.id) {
      return;
    }

    const deliveriesService = new PakkasmarjaApi().getDeliveriesService(accessToken.access_token);
    const deliveryNotes: DeliveryNote[] = await deliveriesService.listDeliveryNotes(deliveryData.delivery.id);

    this.setState({ deliveryNotes });
  }

  /**
   * Handles product change
   *
   * @param productId product ID
   */
  private handleProductChange = async (productId: string) => {
    const { accessToken, route } = this.props;
    const { products } = this.state;

    if (!accessToken) return;

    const category: ItemGroupCategory = route.params.category;
    const deliveryQualitiesService = new PakkasmarjaApi().getDeliveryQualitiesService(accessToken.access_token);
    const deliveryQualities = await deliveryQualitiesService.listDeliveryQualities(category, productId);
    const product = products.find(product => product.id === productId);

    await this.fetchContractQuantities(product);

    this.setState({
      deliveryQualities,
      product,
      productId,
      deliveryQualityId: undefined
    });
  }

  /**
   * Get product price
   */
  private getProductPrice = async () => {
    const { accessToken } = this.props;
    const { productId, selectedDate } = this.state;
    if (!accessToken || !productId) {
      return;
    }

    const productPricesService = new PakkasmarjaApi().getProductPricesService(accessToken.access_token);
    const productPrice: ProductPrice[] = await productPricesService.listProductPrices(
      productId,
      "CREATED_AT_DESC",
      selectedDate,
      undefined,
      1
    );

    productPrice[0] ?
      this.setState({ productPrice: productPrice[0] }) :
      this.renderAlert();
  }

  /**
   * Show alert when no product price found
   */
  private renderAlert = () => {
    Alert.alert(
      'Tuotteelle ei löytynyt hintaa',
      `Tuotteelle ${this.state.product?.name || ""} ei löytynyt hintaa, ota yhteyttä pakkasmarjaan`,
      [{ text: 'OK' }]
    );
  }

  /**
   * Returns a range of available delivery hours
   */
  private getAvailableHoursRange = () => {
    const { selectedDate } = this.state;

    return extendedMoment.range(
      moment(selectedDate).startOf("day").hours(9),
      moment(selectedDate).startOf("day").hours(20)
    );
  };

  /**
   * Returns delivery time options as list of dates
   */
  private getDeliveryTimeOptions = (): Date[] => {
    const momentDateArray = Array.from(this.getAvailableHoursRange().by("minutes", { step: 15, excludeEnd: true }));
    return momentDateArray.map(date => date.toDate());
  }

  /**
   * Returns whether given date is valid delivery time
   *
   * @param date date
   */
  private isValidDeliveryTime = (date: Date) => {
    return this.getAvailableHoursRange().contains(date);
  };

  /**
   * Prints time from Date
   *
   * @param date date
   * @returns time string formatted to finnish locale
   */
  private printTime = (date: Date): string => {
    return moment(date).format("HH.mm");
  }

  /**
   * Find contact
   *
   * @param query query string
   */
  private findContacts = async (query?: string) => {
    const { accessToken } = this.props;

    if (this.contactDebounce) {
      clearTimeout(this.contactDebounce);
      this.contactDebounce = undefined;
    }

    this.setState({ query });

    if (!accessToken || !query) {
      this.setState({ contacts: [] });
      return;
    }

    this.contactDebounce = setTimeout(async () => {
      this.setState({
        contacts: await new PakkasmarjaApi()
          .getContactsService(accessToken.access_token)
          .listContacts(query)
      });
    }, 500);
  }

  /**
   * Returns whether form is valid or not
   *
   * @return whether form is valid or not
   */
  private isValid = () => {
    const { product, selectedDate, deliveryQualityId, deliveryPlaceId } = this.state;
    return !!(
      product &&
      selectedDate &&
      this.isValidDeliveryTime(selectedDate) &&
      deliveryQualityId &&
      deliveryPlaceId
    );
  }

  /**
   * Render input field
   *
   * @param key key
   * @param keyboardType keyboard type
   * @param label label
   */
  private renderInputField = (key: BoxKey, keyboardType: KeyboardType, label: string) => {
    return (
      <View key={ key }>
        <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={ styles.textWithSpace }>
            { label }
          </Text>
        </View>
        <Input
          style={{
            height: 50,
            borderColor: "red",
            backgroundColor: "white",
            borderWidth: 1,
            borderRadius: 8,
            textAlign: "center"
          }}
          keyboardType={ keyboardType }
          value={ this.state[key].toString() }
          onChangeText={ text => this.setState({ ...this.state, [key]: Number(text) }) }
        />
      </View>
    );
  }

  /**
   * Renders contract info
   */
  private renderContractInfo = () => {
    const { contractQuantities, amount, product } = this.state;

    if (!product || !contractQuantities?.length) return;

    const amountInKgs = amount * product.units * product.unitSize;
    const totalAmount = contractQuantities.reduce((total, { contractQuantity }) => total + (contractQuantity || 0), 0);
    const deliveredAmount = contractQuantities.reduce((total, { deliveredQuantity }) => total + (deliveredQuantity || 0), 0);
    const remaining = totalAmount - deliveredAmount - amountInKgs;

    return (
      <View>
        <Text>
          { strings.contractQuantity }: { totalAmount }Kg
        </Text>
        <Text>
          { strings.deliveredQuantity }: { deliveredAmount }Kg
        </Text>
        <View
          style={{
            borderBottomColor: 'black',
            borderBottomWidth: 2,
            width: 190
          }}
        />
        { remaining >= 0 ?
            <Text>{ strings.contractRemainer }: { remaining }Kg</Text> :
            <Text style={{ color: "red" }}>{ strings.contractExceeded }: { Math.abs(remaining) }Kg</Text>
        }
      </View>
    )
  }

  /**
   * Render method
   */
  public render() {
    const { navigation } = this.props;
    const {
      loading,
      query,
      deliveryData,
      deliveryNoteData,
      isNewDelivery,
      contacts,
      selectedContact,
      products,
      product,
      productId,
      noteEditable,
      category,
      productPrice,
      amount,
      selectedDate,
      datepickerVisible,
      deliveryPlaces,
      deliveryPlaceId,
      deliveryQualities,
      deliveryQualityId,
      deliveryNotes,
      deliveryNoteId,
      deliveryNoteDatas,
      modalOpen,
      createModal,
      editModal
    } = this.state;

    if (loading) {
      return (
        <View style={ styles.loaderContainer }>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

    const comp = (a: any, b: any) => a.toLowerCase().trim() === b.toLowerCase().trim();

    const boxInputs: { key: BoxKey, label: string }[] = [{
      key: "redBoxesLoaned",
      label: "Lainattu (Punaiset laatikot)"
    },
    {
      key: "redBoxesReturned",
      label: "Palautettu (Punaiset laatikot)"
    },
    {
      key: "grayBoxesLoaned",
      label: "Lainattu (Harmaat laatikot)"
    },
    {
      key: "grayBoxesReturned",
      label: "Palautettu (Harmaat laatikot)"
    },
    {
      key: "orangeBoxesLoaned",
      label: "Lainattu (oranssit laatikot)"
    },
    {
      key: "orangeBoxesReturned",
      label: "Palautettu (oranssit laatikot)"
    }, {
      key: "greenBoxesLoaned",
      label: "Lainattu (vihreät laatikot)"
    }, {
      key: "greenBoxesReturned",
      label: "Palautettu (vihreät laatikot)"
    }];

    const availableDeliveryTimes = this.getDeliveryTimeOptions();

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
        <View style={ styles.deliveryContainer }>
          { this.renderContractInfo() }
          {
            isNewDelivery &&
            <View>
              <Autocomplete
                autoCapitalize="none"
                autoCorrect={ false }
                data={ contacts?.length === 1 && comp(query, contacts[0].displayName) ? [] : contacts }
                defaultValue={ query }
                onChangeText={ this.findContacts }
                placeholder="Kirjoita kontaktin nimi"
                hideResults={ selectedContact?.displayName === query }
                renderItem={ (contact: any) =>
                  <ListItem
                    style={{ backgroundColor: "#fff" }}
                    onPress={ () => this.setState({ selectedContact: contact, query: contact.displayName }) }
                  >
                    <Text>{ contact.displayName }</Text>
                  </ListItem>
                }
              />
            </View>
          }
          <Text style={ styles.textWithSpace }>
            Tuote
          </Text>
          { !products.length ? (
              <Text>
                viljelijällä ei ole voimassa olevaa sopimusta
              </Text>
            ) : (
              <View style={[ styles.pickerWrap, { width: "100%" } ]}>
                { Platform.OS !== "ios" &&
                  <Picker
                    selectedValue={ productId }
                    style={{ height: 50, width: "100%", color: "black" }}
                    onValueChange={ this.handleProductChange }
                  >
                    {
                      products.map(product =>
                        <Picker.Item
                          key={ product.id }
                          label={ product.name || "" }
                          value={ product.id }
                        />
                      )
                    }
                  </Picker>
                }
                { Platform.OS === "ios" &&
                  <ModalSelector
                    data={ products?.map(({ id, name }) => ({ key: id, label: name })) }
                    selectedKey={ productId }
                    initValue="Valitse tuote"
                    onChange={ (option: any) => this.handleProductChange(option.key) }
                  />
                }
              </View>
            )
          }
          { category === "FRESH" &&
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingTop: 15 }}>
              <View style={{ flex: 0.1 }}>
                <EntypoIcon
                  name='info-with-circle'
                  color='#e01e36'
                  size={20}
                />
              </View >
              <View style={{ flex: 1.1 }}>
                <Text style={ styles.textPrediction }>
                  { productPrice ?
                    `Hinta ${productPrice.price} € / ${productPrice.unit.toUpperCase()} ALV 0%` :
                    "Tuotteelle ei löydy hintaa"
                  }
                </Text>
              </View>
            </View>
          }
          { product?.unitName &&
            <Text style={ styles.textWithSpace }>
              Määrä ({ product.unitName })
            </Text>
          }
          <View style={[ styles.center, styles.numericInputContainer ]}>
            <NumericInput
              value={ amount }
              initValue={ amount }
              onChange={ (value: number) => this.setState({ amount: value }) }
              totalWidth={ Dimensions.get("window").width - (styles.deliveryContainer.padding * 2) - 20 }
              totalHeight={ 50 }
              iconSize={ 35 }
              step={ 10 }
              valueType="real"
              minValue={ 0 }
              textColor="black"
              rightButtonBackgroundColor="#e01e36"
              leftButtonBackgroundColor="#e01e36"
              borderColor="transparent"
              rounded
            />
          </View>
          <View style={{ flex: 1, flexDirection: "row", marginTop: 5 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                <Text style={ styles.textWithSpace }>
                  Toimituspäivä
                </Text>
              </View>
              <TouchableOpacity
                style={ styles.pickerWrap }
                onPress={ () => this.setState({ datepickerVisible: true }) }
              >
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <View style={{ flex: 3, justifyContent: "center", alignItems: "flex-start" }}>
                    <Text style={{ paddingLeft: 10 }}>
                      { selectedDate ?
                        moment(selectedDate).format("DD.MM.YYYY") :
                        "Valitse päivä"
                      }
                    </Text>
                  </View>
                  <View style={[ styles.center, { flex: 0.6 } ]}>
                    <Icon
                      style={{ color: "#e01e36" }}
                      type="AntDesign"
                      name="calendar"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              date={ selectedDate }
              mode="date"
              isVisible={ datepickerVisible }
              onConfirm={ date =>
                this.setState({
                  selectedDate: moment(date)
                    .startOf("day")
                    .hours(selectedDate?.getHours() || availableDeliveryTimes[0].getHours())
                    .minutes(selectedDate?.getMinutes() || availableDeliveryTimes[0].getMinutes())
                    .toDate(),
                  datepickerVisible: false
                })
              }
              onCancel={ () => this.setState({ datepickerVisible: false }) }
            />
          </View>
          <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
            <Text style={ styles.textWithSpace }>Ajankohta</Text>
          </View>
          <View style={[ styles.pickerWrap, { width: "100%" } ]}>
          { Platform.OS !== "ios" && (
            <Picker
              selectedValue={ selectedDate?.valueOf() }
              enabled={ !!selectedDate }
              style={{ height: 50, width: "100%", color: !selectedDate ? "silver" : "black" }}
              onValueChange={ (itemValue: string) =>
                this.setState({ selectedDate: new Date(itemValue) })
              }
            >
              {
                availableDeliveryTimes.map(time =>
                  <Picker.Item
                    key={ time.valueOf() }
                    label={ this.printTime(time) }
                    value={ time.valueOf() }
                  />
                )
              }
            </Picker>
          )}
          { Platform.OS === "ios" && (
            <ModalSelector
              data={
                availableDeliveryTimes.map(time => ({
                  key: time.valueOf(),
                  label: this.printTime(time)
                }))
              }
              selectedKey={ selectedDate?.valueOf() }
              initValue="Valitse toimitusaika"
              onChange={ ({ key }) => this.setState({ selectedDate: new Date(key) }) }
            />
          )}
          </View>
          <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start", marginTop: 5 }}>
            <Text style={ styles.textWithSpace }>
              Toimituspaikka
            </Text>
          </View>
          <View style={[ styles.pickerWrap, { width: "100%" } ]}>
            { Platform.OS !== "ios" &&
              <Picker
                selectedValue={ deliveryPlaceId }
                style={{ height: 50, width: "100%", color: "black" }}
                onValueChange={ (itemValue: string) => this.setState({ deliveryPlaceId: itemValue }) }
              >
                {
                  deliveryPlaces?.map(deliveryPlace =>
                    <Picker.Item
                      key={ deliveryPlace.id }
                      label={ deliveryPlace.name || "" }
                      value={ deliveryPlace.id }
                    />
                  )
                }
              </Picker>
            }
            { Platform.OS === "ios" &&
              <ModalSelector
                data={ deliveryPlaces?.map(({ id, name }) => ({ key: id, label: name })) || [] }
                selectedKey={ deliveryPlaceId }
                initValue="Valitse toimituspaikka"
                onChange={ (option: any) =>
                  this.setState({ deliveryPlaceId: option.key })
                }
              />
            }
          </View>
          { category === "FROZEN" &&
            boxInputs.map(box => this.renderInputField(box.key, "numeric", box.label))
          }
          <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start", marginTop: 5 }}>
            <Text style={ styles.textWithSpace }>
              Laatu
            </Text>
          </View>
          <View style={[ styles.pickerWrap, { width: "100%" } ]}>
            { Platform.OS !== "ios" &&
              <Picker
                selectedValue={ deliveryQualityId }
                style={{ height: 50, width: "100%", color: "black" }}
                onValueChange={ (itemValue: string) =>
                  this.setState({ deliveryQualityId: itemValue })
                }
              >
                <Picker.Item
                  label="Valitse laatu"
                  value=""
                />
                {
                  deliveryQualities?.map(deliveryQuality =>
                    <Picker.Item
                      key={ deliveryQuality.id }
                      label={ deliveryQuality.name || "" }
                      value={ deliveryQuality.id }
                    />
                  )
                }
              </Picker>
            }
            { Platform.OS === "ios" &&
              <ModalSelector
                data={ deliveryQualities?.map(({ id, name }) => ({ key: id, label: name })) || [] }
                selectedKey={ deliveryQualityId }
                initValue="Valitse laatu"
                onChange={ (option: any) => this.setState({ deliveryQualityId: option.key }) }
              />
            }
          </View>
          <View style={{ flex: 1 }}>
            { !isNewDelivery ? (
                <>
                  { deliveryNotes?.map((deliveryNote, index) =>
                    <View
                      key={ index }
                      style={[ styles.center, { paddingVertical: 10 } ]}
                    >
                      <TouchableOpacity onPress={ () => this.setState({ deliveryNoteId: deliveryNote.id, editModal: true }) }>
                        <View style={[ styles.center, { flexDirection: "row" } ]}>
                          <IconPen
                            size={ 25 }
                            style={{ color: "#e01e36" }}
                            name="pencil"
                          />
                          <Text style={{ fontSize: 16, color: "#e01e36" }}>
                            { `Katso/poista huomio ${index + 1}` }
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={[ styles.center, { paddingTop: 10 } ]}>
                    <TouchableOpacity onPress={ () => this.setState({ createModal: true }) }>
                      <View style={[ styles.center, { flexDirection: "row" } ]}>
                        <IconPen
                          size={ 25 }
                          style={{ color: "#e01e36" }}
                          name="pencil"
                        />
                        <Text style={{ fontSize: 16, color: "#e01e36" }}>
                          Lisää huomio
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <CreateDeliveryNoteModal
                    loadDeliveryNotes={ this.loadDeliveryNotes }
                    deliveryId={ deliveryData?.delivery.id || "" }
                    modalClose={ () => this.setState({ createModal: false }) }
                    modalOpen={ createModal }
                  />
                  <ViewOrDeleteNoteModal
                    loadDeliveryNotes={ this.loadDeliveryNotes }
                    deliveryId={ deliveryData?.delivery.id || "" }
                    deliveryNoteId={ deliveryNoteId || "" }
                    modalClose={ () => this.setState({ editModal: false }) }
                    modalOpen={ editModal }
                  />
                </>
              ) : (
                <>
                  {
                    deliveryNoteDatas?.map((deliveryNoteData, index) =>
                      <View
                        key={ index }
                        style={[ styles.center, { paddingVertical: 15 } ]}
                      >
                        <TouchableOpacity onPress={ () => this.setState({ deliveryNoteData, noteEditable: true, modalOpen: true }) }>
                          <View style={[ styles.center, { flexDirection: "row" } ]}>
                            <Icon
                              type="EvilIcons"
                              style={{ color: "#e01e36" }}
                              name="pencil"
                            />
                            <Text style={{ color: "#e01e36" }}>
                              Katso/poista huomio
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )
                  }
                  <View style={[ styles.center, { paddingTop: 10 } ]}>
                    <TouchableOpacity
                      onPress={ () =>
                        this.setState({
                          deliveryNoteData: {
                            imageUri: "",
                            imageType: "",
                            text: ""
                          },
                          noteEditable: false,
                          modalOpen: true
                        })
                      }
                    >
                      <View style={[ styles.center, { flexDirection: "row" } ]}>
                        <IconPen
                          size={ 25 }
                          style={{ color: "#e01e36" }}
                          name="pencil"
                        />
                        <Text style={{ fontSize: 16, color: "#e01e36" }} >
                          Lisää huomio
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <DeliveryNoteModal
                    onRemoveNote={ this.onRemoveNote }
                    editable={ noteEditable }
                    imageUri={ deliveryNoteData?.imageUri }
                    onCreateNoteClick={ this.onCreateNoteClick }
                    deliveryNoteData={ deliveryNoteData }
                    onDeliveryNoteChange={ this.onDeliveryNoteChange }
                    onDeliveryNoteImageChange={ (fileUri, fileType) => this.onDeliveryNoteImageChange(fileUri, fileType) }
                    modalClose={ () => this.setState({ modalOpen: false }) }
                    modalOpen={ modalOpen }
                  />
                </>
              )
            }
          </View>
          { selectedContact && !selectedContact.equipmentInspected &&
            <View style={{ marginVertical: 16 }}>
              <Card noShadow style={{ borderColor: "red", borderRadius: 8, borderWidth: 2 }}>
                <View style={{ padding: 16, paddingBottom: 8 }}>
                  <Text style={{ color: "red", fontWeight: "bold" }}>Viljelijän kalustoa ei ole tarkastettu</Text>
                </View>
                <ListItem>
                  <CheckBox
                    color="#E51D2A"
                    checked={ this.state.shouldMarkEquipmentInspected }
                    onPress={ () => this.setState({ shouldMarkEquipmentInspected: !this.state.shouldMarkEquipmentInspected }) }
                  />
                  <Body>
                    <Text>Merkkaa tarkastetuksi</Text>
                  </Body>
                </ListItem>
              </Card>
            </View>
          }
          {
            !this.isValid() &&
            <View style={ styles.center }>
              <Text style={{ color: "red" }}>
                Puuttuu tarvittavia tietoja
              </Text>
            </View>
          }
          { deliveryData?.delivery.status !== "DONE" &&
            <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
              <AsyncButton
                disabled={ !this.isValid() }
                style={[ styles.deliveriesButton, styles.center, { width: "70%", height: 60, marginTop: 15 } ]}
                onPress={ this.handleDeliveryAccept }
              >
                <Text style={ styles.buttonText }>
                  Hyväksy toimitus
                </Text>
              </AsyncButton>
            </View>
          }
          { deliveryData?.delivery.status !== "DONE" && !isNewDelivery &&
            <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
              <AsyncButton
                disabled={ !this.isValid() }
                style={[ styles.declineButton, styles.center, { width: "70%", height: 60, marginTop: 15 } ]}
                onPress={ this.handleDeliveryReject }
              >
                <Text style={ styles.buttonText }>
                  Hylkää toimitus
                </Text>
              </AsyncButton>
            </View>
          }
        </View>
      </BasicScrollLayout>
    );
  }

  /**
   * On delivery note image change
   *
   * @param fileUri file URI
   * @param fileType file type
   */
  private onDeliveryNoteImageChange = (fileUri?: string, fileType?: string) => {
    this.setState({
      deliveryNoteFile: fileUri && fileType ?
        { fileUri, fileType } :
        undefined
    });
  }

  /**
   * Adds a delivery note
   *
   * @param deliveryNoteData deliveryNoteData
   */
  private onDeliveryNoteChange = (deliveryNoteData: DeliveryNoteData) => {
    this.setState({ deliveryNoteData: deliveryNoteData });
  }

  /**
   * On create note click
   */
  private onCreateNoteClick = () => {
    const { deliveryNoteDatas, deliveryNoteData } = this.state;
    this.setState({
      deliveryNoteDatas: [ ...deliveryNoteDatas, deliveryNoteData ],
      deliveryNoteData: {
        imageUri: "",
        imageType: "",
        text: ""
      }
    });
  }

  /**
   * On remove note
   */
  private onRemoveNote = () => {
    const { deliveryNoteDatas, deliveryNoteData } = this.state;

    this.setState({
      deliveryNoteDatas: deliveryNoteDatas.filter(note => note !== deliveryNoteData),
      modalOpen: false
    });
  }

  /**
   * Create delivery notes
   *
   * @param deliveryId delivery ID
   * @param deliveryNoteData delivery note data
   * @returns promise of created delivery note
   */
  private async createDeliveryNote(deliveryId: string, deliveryNoteData: DeliveryNoteData): Promise<DeliveryNote | undefined> {
    const { accessToken } = this.props;

    if (!accessToken) return;

    const { imageUri, imageType } = deliveryNoteData;
    const fileService = new FileService(REACT_APP_API_URL, accessToken.access_token);
    const image = imageUri && imageType ?
      await fileService.uploadFile(deliveryNoteData.imageUri, deliveryNoteData.imageType) :
      undefined;

    return new PakkasmarjaApi()
      .getDeliveriesService(accessToken.access_token)
      .createDeliveryNote(
        {
          text: deliveryNoteData.text,
          image: image?.url
        },
        deliveryId || ""
      );
  }

  /**
   * Fetches contract quantities for given product
   *
   * @param product product
   */
    private fetchContractQuantities = async (product?: Product) => {
      const { accessToken, route } = this.props;
      const { selectedContact, isNewDelivery } = this.state;

      if (!accessToken?.access_token || !product) return;

      this.setState({ loading: true });

      const deliveryData: DeliveryListItem = route.params.deliveryListItem;

      const [ itemGroupId, userId ] = isNewDelivery ?
        [ product.itemGroupId, selectedContact?.id ] :
        [ deliveryData.product?.itemGroupId, deliveryData.contact?.id ];

      if (!itemGroupId || !userId) return;

      const contractQuantities = await new PakkasmarjaApi()
        .getContractsService(accessToken.access_token)
        .listContractQuantities(itemGroupId, userId);

      this.setState({
        contractQuantities: contractQuantities,
        loading: false
      });
    }
  }

/**
 * Redux mapper for mapping store state to component props
 *
 * @param state store state
 */
const mapStateToProps = (state: StoreState) => ({
  accessToken: state.accessToken,
  itemGroupCategory: state.itemGroupCategory,
  deliveries: state.deliveries
});

/**
 * Redux mapper for mapping component dispatches
 *
 * @param dispatch dispatch method
 */
const mapDispatchToProps = (dispatch: Dispatch<actions.AppAction>) => ({
  onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken)),
  deliveriesLoaded: (deliveries: DeliveriesState) => dispatch(actions.deliveriesLoaded(deliveries))
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageDelivery);
