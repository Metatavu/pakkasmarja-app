import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryListItem, KeyboardType, boxKey, DeliveryNoteData } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Picker, TouchableOpacity, TouchableHighlight, Platform, Dimensions, Alert } from "react-native";
import { Delivery, Product, DeliveryNote, DeliveryPlace, ItemGroupCategory, ProductPrice, DeliveryQuality, Contact, ContractQuantities } from "pakkasmarja-client";
import { Text, Icon, Input, ListItem } from "native-base";
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

/**
 * Component props
 */
interface Props {
  navigation: any;
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
  selectedDate: Date;
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
  query?: string;
  selectedContact?: Contact;
  contractQuantities?: ContractQuantities[]; 
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
      selectedDate: new Date(),

      noteEditable: false,
      deliveryNoteData: { text: "", imageType: "", imageUri: "" },
      deliveryNoteDatas: [],

      redBoxesLoaned: 0,
      redBoxesReturned: 0,
      grayBoxesLoaned: 0,
      grayBoxesReturned: 0,

      query: ""
    };
  }

  /**
   * Screen navigation options
   *
   * @param navigation navigation instance
   */
  static navigationOptions = ({ navigation }: any) => ({
    headerTitle: (
      <TopBar
        navigation={ navigation }
        showMenu
        showHeader={ false }
        showUser
      />
    ),
    headerTitleContainerStyle: { left: 0 },
    headerLeft: (
      <TouchableHighlight onPress={() => navigation.goBack(null) }>
        <FeatherIcon
          name="chevron-left"
          color="#fff"
          size={ 40 }
          style={{ marginLeft: 30 }}
        />
      </TouchableHighlight>
    )
  });

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const { accessToken, navigation } = this.props;

    if (!accessToken) {
      return;
    }

    const params = navigation.state.params;
    const selectedDate: Date = params.date;
    const deliveryData: DeliveryListItem = params.deliveryListItem;
    const category: ItemGroupCategory = params.category;
    const isNewDelivery = params.isNewDelivery;

    this.setState({
      loading: true,
      isNewDelivery,
      category,
      selectedDate
    });

    const deliveryPlaces = await new PakkasmarjaApi().getDeliveryPlacesService(accessToken.access_token).listDeliveryPlaces();
    this.setState({ deliveryPlaces });

    await this.listProducts();

    if (!isNewDelivery && deliveryData) {
      const deliveryPlace = deliveryPlaces.find(deliveryPlace =>
        deliveryPlace.id === deliveryData.delivery.deliveryPlaceId
      );

    await this.fetchContracts(deliveryData.product);

      this.setState({
        deliveryData,
        deliveryPlaceId: deliveryPlace?.id,
        amount: deliveryData.delivery.amount,
        selectedDate: new Date(deliveryData.delivery.time),
        loading: false
      }, () => this.loadDeliveryNotes());
    } else {
      this.setState({
        deliveryPlaceId: deliveryPlaces[0].id,
        amount: 0,
        loading: false
      });
    }
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
    const { accessToken, navigation } = this.props;
    const { selectedContact } = this.state;

    if (!accessToken) {
      return;
    }

    const params = navigation.state.params;
    const deliveryData: DeliveryListItem = params.deliveryListItem;
    const isNewDelivery: boolean = params.isNewDelivery;
    const category: ItemGroupCategory = params.category;

    this.setState({ products: [], productPrice: undefined });

    const Api = new PakkasmarjaApi();
    const productsService = Api.getProductsService(accessToken.access_token);
    const deliveryQualitiesService = Api.getDeliveryQualitiesService(accessToken.access_token);

    if (!isNewDelivery && deliveryData?.product && deliveryData.contact) {
      const deliveryProductId = deliveryData.product.id;
      const products = await productsService.listProducts(undefined, category, deliveryData.contact.id, undefined, 999);
      const deliveryQualities = await deliveryQualitiesService.listDeliveryQualities(category, deliveryProductId);

      this.setState({
        productId: deliveryProductId,
        product: deliveryData.product,
        products: products,
        deliveryQualities: deliveryQualities
      }, () => this.getProductPrice());
    } else {
      if (!selectedContact) {
        return;
      }

      const products = await productsService.listProducts(undefined, category, selectedContact.id, undefined, 999);
      const productId = products.length ? products[0].id : "";
      const deliveryQualities = await deliveryQualitiesService.listDeliveryQualities(category, productId);

      await this.fetchContracts(products.length ? products[0] : undefined);

      this.setState({
        productId: productId,
        product: products.length ? products[0] : undefined,
        products: products,
        deliveryQualities
      }, () => this.getProductPrice());
    }
  }

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
      deliveryNoteDatas
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
        { item: "RED_BOX", loaned: this.state.redBoxesLoaned, returned: this.state.redBoxesReturned },
        { item: "GRAY_BOX", loaned: this.state.grayBoxesLoaned, returned: this.state.grayBoxesReturned }
      ]
    }

    const deliveryService = new PakkasmarjaApi().getDeliveriesService(accessToken.access_token);

    if (isNewDelivery) {
      const createdDelivery: Delivery = await deliveryService.createDelivery(delivery);

      if (deliveryNoteDatas.length && createdDelivery.id) {
        await Promise.all(
          deliveryNoteDatas.map(deliveryNote =>
            this.createDeliveryNote(createdDelivery.id || "", deliveryNote)
          )
        );
      }
    } else {
      deliveryData && await deliveryService.updateDelivery(delivery, deliveryData.delivery.id!);
    }

    navigation.navigate("Deliveries");
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
      deliveryQualityId
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

    const deliveryService = new PakkasmarjaApi().getDeliveriesService(accessToken.access_token);
    const date = moment(this.state.selectedDate).utc().toDate();

    await deliveryService.updateDelivery(
      {
        id: deliveryData.delivery.id,
        productId: product.id,
        userId: accessToken.userId,
        time: date,
        status: "NOT_ACCEPTED",
        amount: amount,
        deliveryPlaceId: deliveryPlaceId,
        qualityId: deliveryQualityId
      },
      deliveryData.delivery.id
    );

    navigation.navigate("Deliveries");
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
    const { accessToken, navigation } = this.props;
    const { products } = this.state;

    if (!accessToken) {
      return;
    }

    const category: ItemGroupCategory = navigation.state.params.category;
    const deliveryQualitiesService = new PakkasmarjaApi().getDeliveryQualitiesService(accessToken.access_token);
    const deliveryQualities = await deliveryQualitiesService.listDeliveryQualities(category, productId);
    const product = products.find((product) => product.id === productId);

    await this.fetchContracts(product);

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

    if (!accessToken || !query) {
      return;
    }

    this.setState({ query });

    this.contactDebounce = setTimeout(async () => this.setState({
      contacts: await new PakkasmarjaApi()
        .getContactsService(accessToken.access_token)
        .listContacts(query)
    }), 500);
  }

  /**
   * Returns whether form is valid or not
   * 
   * @return whether form is valid or not
   */
  private isValid = () => {
    const { product, selectedDate, deliveryQualityId, deliveryPlaceId } = this.state;
    return !!product && !!selectedDate && !!deliveryQualityId && !!deliveryPlaceId;
  }

  /**
   * Render input field
   *
   * @param key key
   * @param keyboardType keyboard type
   * @param label label
   */
  private renderInputField = (key: boxKey, keyboardType: KeyboardType, label: string) => {
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

  private renderContractInfo = () => {
    const { contractQuantities, amount, product } = this.state;

    if (!product || !contractQuantities || !contractQuantities?.length) {
      return null;
    }

    var contractQuantity = 0;
    var delivered = 0
    var remainer = 0;

    contractQuantities?.forEach(contract => {
      delivered = delivered + (contract.deliveredQuantity || 0);
      contractQuantity = contractQuantity + (contract.contractQuantity || 0);
    })

    remainer = contractQuantity - delivered - (amount * product.units * product.unitSize);

    return (
      <View>
        <Text>
          { strings.contractQuantity }: { contractQuantity }Kg
        </Text>
        <Text>
          { strings.deliveredQuantity }: { delivered }Kg
        </Text>
        <View
          style={{
            borderBottomColor: 'black',
            borderBottomWidth: 2,
            width: 190
          }}
        />
        { remainer >= 0 ?
            <Text>{ strings.contractRemainer }: { remainer }Kg</Text> :
            <Text style={{ color: "red" }}>{ strings.contractExceeded }: { Math.abs(remainer) }Kg</Text> 
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

    const boxInputs: { key: boxKey, label: string }[] = [{
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
    }]

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
          { products.length < 1 ? (
              <Text>
                Kontaktilla ei ole voimassa olevaa sopimusta
              </Text>
            ) : (
              <View style={[ styles.pickerWrap, { width: "100%" } ]}>
                { Platform.OS !== "ios" &&
                  <Picker
                    selectedValue={ productId }
                    style={{ height: 50, width: "100%" }}
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
              iconStyle={{ color: "white" }}
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
                        moment(selectedDate).format("DD.MM.YYYY HH:mm") :
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
              mode="datetime"
              is24Hour
              isVisible={ datepickerVisible }
              onConfirm={ date => this.setState({ selectedDate: date, datepickerVisible: false }) }
              onCancel={ () => this.setState({ datepickerVisible: false }) }
            />
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
                style={{ height: 50, width: "100%" }}
                onValueChange={ itemValue => this.setState({ deliveryPlaceId: itemValue }) }
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
                data={ deliveryPlaces?.map(({ id, name }) => ({ key: id, label: name })) }
                selectedKey={ deliveryPlaceId }
                initValue="Valitse toimituspaikka"
                onChange={ (option: any) => this.setState({ deliveryPlaceId: option.key }) }
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
                style={{ height: 50, width: "100%" }}
                onValueChange={ itemValue => this.setState({ deliveryQualityId: itemValue }) }
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
                data={ deliveryQualities?.map(({ id, name }) => ({ key: id, label: name })) }
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
          {
            !this.isValid() &&
            <View style={ styles.center }>
              <Text style={{ color: "red" }}>
                Puuttuu tarvittavia tietoja
              </Text>
            </View>
          }
          { deliveryData?.delivery.status !== "DONE" &&
            <View style={[ styles.center, { flex: 1 } ]}>
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
            <View style={[ styles.center, { flex: 1 } ]}>
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
    this.setState({
      deliveryNoteDatas: [
        ...this.state.deliveryNoteDatas,
        this.state.deliveryNoteData
      ],
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
    this.setState({
      deliveryNoteDatas: this.state.deliveryNoteDatas.filter(note => note !== this.state.deliveryNoteData),
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
  private async createDeliveryNote(deliveryId: string, deliveryNoteData: DeliveryNoteData): Promise<DeliveryNote | null> {
    const { accessToken } = this.props;

    if (!accessToken) {
      return null;
    }

    const { imageUri, imageType } = deliveryNoteData;
    const fileService = new FileService(REACT_APP_API_URL, accessToken.access_token);
    const image = imageUri && imageType && await fileService.uploadFile(deliveryNoteData.imageUri, deliveryNoteData.imageType);

    const deliveryService = new PakkasmarjaApi().getDeliveriesService(accessToken.access_token);
    return deliveryService.createDeliveryNote(
      {
        text: deliveryNoteData.text,
        image: image ? image.url : undefined
      },
      deliveryId || ""
    );
  }

  /**
   * @param product product witch contracts will be fetched
   */
    private fetchContracts = async (product?: Product) => {
      const { accessToken, navigation } = this.props;
      const { selectedContact, isNewDelivery } = this.state;

      const params = navigation.state.params;
      const deliveryData: DeliveryListItem = params.deliveryListItem;
  
      const yearNow = parseInt(moment(new Date()).format("YYYY"));
  
      if (!accessToken || !accessToken.access_token || !product) {
        return;
      }

      this.setState({
        loading: true
      });

      const Api = new PakkasmarjaApi();
      const contractsService = await Api.getContractsService(accessToken.access_token);

      if (isNewDelivery && selectedContact && selectedContact.id) {
        const contractQuantities = await contractsService.listContractQuantities(product.itemGroupId, selectedContact.id);

        this.setState({
          contractQuantities: contractQuantities,
          loading: false
        });
      } 

      if (!isNewDelivery && deliveryData && deliveryData.product && deliveryData.contact?.id) {
      const contractQuantities = await contractsService.listContractQuantities(deliveryData.product?.itemGroupId, deliveryData.contact?.id);

        this.setState({
          contractQuantities: contractQuantities,
          loading: false
        });
      }
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
