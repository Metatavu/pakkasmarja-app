import React, { Dispatch } from "react";

import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight, Platform, Dimensions, Alert, StyleProp, TextStyle, ViewStyle } from "react-native";
import { Delivery, Product, DeliveryNote, DeliveryPlace, ItemGroupCategory, ProductPrice, DeliveryQuality } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text, Icon, H1 } from "native-base";
import NumericInput from 'react-native-numeric-input'
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from "moment";
import PakkasmarjaApi from "../../../api";
import FeatherIcon from "react-native-vector-icons/Feather";
import ModalSelector from 'react-native-modal-selector';
import EntypoIcon from "react-native-vector-icons/Entypo";
import { extendMoment } from "moment-range";
import _ from "lodash";
import CreateDeliveryNoteModal from "./CreateDeliveryNoteModal";
import ViewOrDeleteNoteModal from "./ViewOrDeleteNoteModal";
import { filterPossibleDeliveryPlaces, roundPrice } from "../../../utils/utility-functions";
import AsyncButton from "../../generic/async-button";
import { Picker } from "native-base";
import { StackNavigationOptions } from '@react-navigation/stack';

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
  deliveries?: DeliveriesState;
  products?: Product[],
  itemGroupCategory?: ItemGroupCategory;
  deliveriesLoaded?: (deliveries: DeliveriesState) => void;
};

/**
 * Component state
 */
interface State {
  deliveryPlaces?: DeliveryPlace[];
  deliveryPlaceId?: string;
  deliveryData?: DeliveryProduct;
  products: Product[];
  datepickerVisible: boolean,
  modalOpen: boolean;
  loading: boolean;
  productId?: string;
  userId?: string;
  price: string;
  amount: number;
  deliveries: DeliveryProduct[];
  selectedDate?: Date;
  deliveryNotes?: DeliveryNote[];
  createModal: boolean;
  editModal: boolean;
  deliveryNoteId?: string;
  productPrice?: ProductPrice;
  product?: Product;
  noteEditable: boolean;
  deliveryQualities: DeliveryQuality[];
};

/**
 * New delivery component class
 */
class EditDelivery extends React.Component<Props, State> {

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
      price: "",
      products: [],
      createModal: false,
      editModal: false,
      deliveries: [],
      deliveryNotes: [],
      noteEditable: false,
      deliveryQualities: []
    };
  }

  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerStyle: {
        height: 100,
        backgroundColor: "#E51D2A"
      },
      headerTitle: () => <TopBar navigation={navigation}
        showMenu={true}
        showHeader={false}
        showUser={true}
      />,
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft: () =>
        <TouchableHighlight onPress={() => { navigation.goBack(null) }} >
          <FeatherIcon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
    }
  };

  /**
   * Component did mount life cycle event
   */
  public componentDidMount = async () => {
    const { accessToken, itemGroupCategory, navigation, route } = this.props;

    navigation.setOptions(this.navigationOptions(navigation));
    const deliveryData: DeliveryProduct = route.params.deliveryData;
    if (!accessToken || !deliveryData.product || !deliveryData.product.id) {
      return;
    }

    this.setState({ loading: true });
    const Api = new PakkasmarjaApi();
    const productsService = Api.getProductsService(accessToken.access_token);
    const productPricesService = Api.getProductPricesService(accessToken.access_token);
    const deliveryPlacesService = Api.getDeliveryPlacesService(accessToken.access_token);
    const deliveryQualitiesService = Api.getDeliveryQualitiesService(accessToken.access_token);

    const [ unfilteredProducts, deliveryPlaces ] = await Promise.all([
      productsService.listProducts(undefined, itemGroupCategory, accessToken.userId, undefined, 999),
      deliveryPlacesService.listDeliveryPlaces()
    ]);

    const products = unfilteredProducts.filter(product => product.active === true);

    const [ productPrice, deliveryQualities ] = await Promise.all([
      products[0] ? await productPricesService.listProductPrices(products[0].id || "", "CREATED_AT_DESC", undefined, undefined, 1) : [],
      deliveryQualitiesService.listDeliveryQualities(ItemGroupCategory.FRESH, products[0].id || "")
    ]);

    if (deliveryData.product && deliveryData.delivery && deliveryData.delivery.deliveryPlaceId && deliveryData.delivery.amount) {
      const deliveryPlace = await deliveryPlacesService.findDeliveryPlace(deliveryData.delivery.deliveryPlaceId);
      if (!deliveryPlace.id) {
        return;
      }
      this.setState({
        deliveryData,
        products: products,
        deliveryQualities,
        deliveryPlaces: filterPossibleDeliveryPlaces(deliveryPlaces, this.props.itemGroupCategory!),
        userId: accessToken.userId,
        productId: deliveryData.product.id,
        product: deliveryData.product,
        deliveryPlaceId: deliveryPlace.id || "",
        amount: deliveryData.delivery.amount,
        selectedDate: new Date(deliveryData.delivery.time),
        loading: false,
        productPrice: productPrice[0]
      }, () => this.loadDeliveryNotes());
      if (products[0] && !productPrice[0]) {
        this.renderAlert();
      }
    }
  }

  /**
   * Handles delivery submit
   */
  private handleDeliverySubmit = async () => {
    const { accessToken, navigation } = this.props;
    const {
      deliveryPlaceId,
      product,
      selectedDate,
      amount,
      price,
      deliveryData,
      userId
    } = this.state;

    if (
      !accessToken ||
      !product ||
      !product.id ||
      !deliveryPlaceId ||
      !selectedDate ||
      !deliveryData ||
      !deliveryData.product ||
      !deliveryData.delivery.id ||
      !userId
    ) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = Api.getDeliveriesService(accessToken.access_token);

    const delivery: Delivery = {
      id: deliveryData.delivery.id,
      productId: product.id,
      userId: userId,
      time: selectedDate,
      status: "PLANNED",
      amount: amount,
      price: price,
      deliveryPlaceId: deliveryPlaceId
    }

    const updatedDelivery = await deliveryService.updateDelivery(delivery, deliveryData.delivery.id);
    this.updateDeliveries(updatedDelivery);
    navigation.navigate("IncomingDeliveries");
  }

  /**
   * Update deliveries
   */
  private updateDeliveries = (delivery: Delivery) => {
    if (!this.props.deliveries) {
      return;
    }

    const product = this.state.products.find(product => product.id === delivery.productId);
    const deliveries = this.getDeliveries();
    const updatedDeliveries = deliveries.map(deliveryData => {
      if (deliveryData.delivery.id === delivery.id) {
        return {
          delivery: delivery,
          product: product
        }
      }
      return deliveryData;
    });

    const deliveriesState = this.props.deliveries;

    if (this.props.itemGroupCategory === "FROZEN") {
      deliveriesState.frozenDeliveryData = updatedDeliveries;
    } else {
      deliveriesState.freshDeliveryData = updatedDeliveries;
    }

    this.props.deliveriesLoaded && this.props.deliveriesLoaded(deliveriesState);
  }

  /**
   * Get deliveries
   *
   * @return deliveries
   */
  private getDeliveries = () => {
    if (!this.props.deliveries) {
      return [];
    }

    if (this.props.itemGroupCategory === "FROZEN") {
      return this.props.deliveries.frozenDeliveryData;
    }

    return this.props.deliveries.freshDeliveryData;
  }

  /**
   * Load delivery notes
   */
  private loadDeliveryNotes = async () => {
    if (!this.props.accessToken || !this.state.deliveryData) {
      return;
    }
    const Api = new PakkasmarjaApi();
    const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const deliveryNotes: DeliveryNote[] = await deliveriesService.listDeliveryNotes(this.state.deliveryData.delivery.id || "");
    this.setState({ deliveryNotes });
  }

  /**
   * Returns a range of available delivery hours
   */
  private getAvailableHoursRange = () => {
    const { selectedDate } = this.state;

    return extendedMoment.range(
      moment(selectedDate).startOf("day").hours(10),
      moment(selectedDate).startOf("day").hours(17)
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
  * Prints date from Date
  *
  * @param date date
  * @returns date string formatted to finnish locale
  */
  private printDate(date: Date): string {
    return moment(date).format("DD.MM.YYYY");
  }

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
   * Handles product change
   */
  private handleProductChange = async (productId: string) => {
    const { accessToken } = this.props;

    if (!accessToken) {
      return;
    }
    this.setState({ productId });
    const products = this.state.products;
    const product = products.find((product) => product.id === productId)
    const Api = new PakkasmarjaApi();
    const productPricesService = await Api.getProductPricesService(accessToken.access_token);
    const deliveryQualitiesService = Api.getDeliveryQualitiesService(accessToken.access_token);

    const [ productPrice, deliveryQualities ] = await Promise.all([
      productPricesService.listProductPrices(productId, "CREATED_AT_DESC", undefined, undefined, 1),
      deliveryQualitiesService.listDeliveryQualities(ItemGroupCategory.FRESH, productId)
    ]);

    if (!productPrice[0]) {
      this.renderAlert();
    }

    this.setState({
      product,
      productPrice: productPrice[0], deliveryQualities
    });
  }

  /**
   * Show alert when no product price found
   */
  private renderAlert = () => {
    Alert.alert(
      'Tuotteelle ei löytynyt hintaa',
      `Tuotteelle ${this.state.product && this.state.product.name} ei löytynyt hintaa, ota yhteyttä pakkasmarjaan`,
      [
        { text: 'OK', onPress: () => { } },
      ]
    );
  }

  /**
   * Returns whether form is valid or not
   *
   * @return whether form is valid or not
   */
  private isValid = () => {
    const { product, selectedDate, deliveryPlaceId } = this.state;

    return !!(
      product
      && selectedDate
      && this.isValidDeliveryTime(selectedDate)
      && deliveryPlaceId
    );
  }

  /**
   * Render method
   */
  public render() {
    const { navigation } = this.props;
    const {
      loading,
      products,
      product,
      amount,
      deliveryData,
      deliveryNoteId,
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

    return (
      <BasicScrollLayout navigation={ navigation } backgroundColor="#fff" displayFooter={ true }>
        <View style={ styles.deliveryContainer }>
          <Text style={ styles.textWithSpace }>Valitse tuote</Text>
          { products.length < 1 ?
            <Text>Ei voimassa olevaa sopimusta. Jos näin ei pitäisi olla, ole yhteydessä Pakkasmarjaan.</Text>
            :
            <>
              <View style={[ styles.pickerWrap, { width: "100%" } ]}>
                { this.renderProductSelection() }
              </View>
              <View>
                { this.renderProductPrice() }
              </View>
              <View style={{ marginBottom: 20 }}>
                { this.renderFreshProductQualityPrices() }
              </View>
            </>
          }
          <Text style={ styles.textWithSpace }>Määrä ({ product && product.unitName })</Text>
          <View style={[ styles.center, styles.numericInputContainer ]}>
            <NumericInput
              value={ amount }
              initValue={ amount }
              onChange={ (value: number) => this.setState({ amount: value }) }
              totalWidth={ Dimensions.get('window').width - (styles.deliveryContainer.padding * 2) - 20 }
              totalHeight={ 50 }
              iconSize={ 35 }
              step={ 10 }
              valueType='real'
              minValue={ 0 }
              textColor='black'
              rightButtonBackgroundColor='#e01e36'
              leftButtonBackgroundColor='#e01e36'
              borderColor='transparent'
              rounded
            />
          </View>
          <View style={{ flex: 1, flexDirection: "row", marginTop: 15 }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text>= { product && amount * (product.units * product.unitSize) } KG</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: "row", marginTop: 15 }}>
            <View style={{ flex: 1 }}>
              { this.renderDeliveryDateSelection() }
            </View>
            <View style={{ flex: 1, marginLeft: "4%" }}>
              { this.renderDeliveryTimeSelection() }
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
            <Text style={ styles.textWithSpace }>Toimituspaikka</Text>
          </View>
          <View style={[ styles.pickerWrap, { width: "100%" } ]}>
            { this.renderDeliveryPlaceSelection() }
          </View>
          <View style={{ flex: 1 }}>
            { this.renderDeliveryNotes() }
            { this.renderAddDeliveryNote() }
            { !this.isValid() &&
              <View style={[ styles.center, { flex: 1, marginTop: 5 } ]}>
                <Text style={{ color: "red" }}>Tarvittavia tietoja puuttuu</Text>
              </View>
            }
            <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
              <AsyncButton
                disabled={ !this.isValid() }
                style={[ styles.deliveriesButton, styles.center, { width: "50%", height: 60, marginTop: 15 } ]}
                onPress={ this.handleDeliverySubmit }
              >
                <Text style={styles.buttonText}>Tallenna</Text>
              </AsyncButton>
            </View>
          </View>
        </View>
        <CreateDeliveryNoteModal
          loadDeliveryNotes={ this.loadDeliveryNotes }
          deliveryId={ deliveryData && deliveryData.delivery.id || ""}
          modalClose={ () => this.setState({ createModal: false }) }
          modalOpen={ createModal }
        />
        <ViewOrDeleteNoteModal
          loadDeliveryNotes={ this.loadDeliveryNotes }
          deliveryId={ deliveryData && deliveryData.delivery.id || "" }
          deliveryNoteId={ deliveryNoteId || "" }
          modalClose={ () => this.setState({ editModal: false }) }
          modalOpen={ editModal }
        />
      </BasicScrollLayout>
    );
  }

  /**
   * Renders product selection
   */
  private renderProductSelection = () => {
    const { products, product, productId } = this.state;
    if (Platform.OS !== "ios") {
      return (
        <Picker
          selectedValue={ productId }
          style={{ height: 50, width: "100%", color: "black" }}
          onValueChange={(itemValue: string) =>
            this.handleProductChange(itemValue)
          }>
          {
            products.map((product) => {
              return (
                <Picker.Item key={ product.id } label={ product.name || "" } value={ product.id } />
              );
            })
          }
        </Picker>
      );
    } else {
      return (
        <ModalSelector
          data={products && products.map((product) => {
            return {
              key: product.id,
              label: product.name
            };
          })}
          selectedKey={ product ? product.id : undefined }
          initValue="Valitse tuote"
          onChange={ (option: any) => { this.handleProductChange(option.key) }}
        />
      );
    }
  }

  /**
   * Renders product price
   */
  private renderProductPrice = () => {
    const { productPrice } = this.state;

    const rowBaseStyles: StyleProp<ViewStyle> = {
      width: "50%",
      padding: 10,
      flex: 1,
      flexDirection: "row",
      alignItems: "center"
    };

    const alvTextStyles: StyleProp<TextStyle> = {
      fontSize: 14,
      marginLeft: 10
    };

    return (
      <>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingTop: 15, paddingBottom: 10 }}>
          <View style={{ flex: 0.1 }}>
            <EntypoIcon
              name='info-with-circle'
              color='#e01e36'
              size={ 20 }
            />
          </View >
          <View style={{ flex: 1.1 }}>
            { productPrice?.price ?
              <Text style={ styles.textPrediction }>
                { `Tämänhetkinen hinta / ${productPrice.unit.toUpperCase()}` }
              </Text> :
              <Text style={ styles.textPrediction }>
                { `Tuotteelle ei löydy hintaa` }
              </Text>
            }
          </View>
        </View>
        { productPrice?.price &&
          <View style={{ borderWidth: 1, borderColor: "#e01e36", borderRadius: 8, flex: 1, flexDirection: "row" }}>
            <View style={{ ...rowBaseStyles, borderRightWidth: 1, borderRightColor: "#ccc" }}>
              <H1>
                {`${productPrice.price} €`}
              </H1>
              <Text style={ alvTextStyles }>
                {`ALV 0%`}
              </Text>
            </View>
            <View style={ rowBaseStyles }>
              <H1>
                {`${roundPrice(parseFloat(productPrice.price) * 1.14)} €`}
              </H1>
              <Text style={ alvTextStyles }>
                {`ALV 14%`}
              </Text>
            </View>
          </View>
        }
      </>
    );
  }

  /**
   * Renders delivery date selection
   */
  private renderDeliveryDateSelection = () => {
    const { datepickerVisible, selectedDate } = this.state;
    return (
      <>
        <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={ styles.textWithSpace }>Toimituspäivä</Text>
        </View>
        <TouchableOpacity
          style={[ styles.pickerWrap, { width: "98%" } ]}
          onPress={ () => this.setState({ datepickerVisible: true }) }
        >
          <View style={{ flex: 1, flexDirection: "row" }}>
            <View style={{ flex: 3, justifyContent: "center", alignItems: "flex-start" }}>
              <Text style={{ paddingLeft: 10 }}>
                { selectedDate ?
                  this.printDate(selectedDate) :
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
        <DateTimePicker
          date={ selectedDate }
          mode="date"
          isVisible={ datepickerVisible }
          onConfirm={ date => this.setState({
            selectedDate: moment(date)
              .startOf("day")
              .hours(selectedDate?.getHours() || 0)
              .minutes(selectedDate?.getMinutes() || 0)
              .toDate(),
            datepickerVisible: false
          })
          }
          onCancel={ () => this.setState({ datepickerVisible: false }) }
        />
      </>
    );
  }

  /**
   * Renders delivery time selection
   */
  private renderDeliveryTimeSelection = () => {
    return (
      <>
        <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={ styles.textWithSpace }>Ajankohta</Text>
        </View>
        <View style={[ styles.pickerWrap, { width: "100%" } ]}>
          { this.renderTimePicker() }
        </View>
      </>
    );
  }

  /**
   * Renders time picker element
   */
  private renderTimePicker = () => {
    const { selectedDate } = this.state;

    if (Platform.OS !== "ios") {
      return (
        <Picker
          selectedValue={ selectedDate?.valueOf() }
          style={{ height: 50, width: "100%", color: "black" }}
          onValueChange={ (itemValue: string) =>
            this.setState({ selectedDate: new Date(itemValue) })
          }
        >
          {
            this.getDeliveryTimeOptions().map(time =>
              <Picker.Item
                key={ time.valueOf() }
                label={ this.printTime(time) }
                value={ time.valueOf() }
              />
            )
          }
        </Picker>
      );
    }

    return (
      <ModalSelector
        data={
          this.getDeliveryTimeOptions().map(time => ({
            key: time.valueOf(),
            label: this.printTime(time)
          }))
        }
        selectedKey={ selectedDate?.valueOf() }
        initValue="Valitse toimitusaika"
        onChange={ ({ key }) => this.setState({ selectedDate: new Date(key) }) }
      />
    );
  }

  /**
   * Renders delivery place selection
   */
  private renderDeliveryPlaceSelection = () => {
    const { deliveryPlaces, deliveryPlaceId } = this.state;
    if (Platform.OS !== "ios") {
      return (
        <Picker
          selectedValue={ deliveryPlaceId }
          style={{ height: 50, width: "100%", color: "black" }}
          onValueChange={ (itemValue: string) =>
            this.setState({ deliveryPlaceId: itemValue })
          }
        >
          {
            (deliveryPlaces || []).map(deliveryPlace => {
              return (
                <Picker.Item
                  key={ deliveryPlace.id }
                  label={ deliveryPlace.name || "" }
                  value={ deliveryPlace.id }
                />
              );
            })
          }
        </Picker>
      );
    } else {
      return (
        <ModalSelector
          data={
            (deliveryPlaces || []).map(deliveryPlace => {
              return {
                key: deliveryPlace.id,
                label: deliveryPlace.name
              };
            })
          }
          selectedKey={ deliveryPlaceId }
          initValue="Valitse toimituspaikka"
          onChange={ (option: any) => this.setState({ deliveryPlaceId: option.key }) }
        />
      );
    }
  }

  /**
   * Renders delivery notes
   */
  private renderDeliveryNotes = () => {
    const { deliveryNotes } = this.state;
    if (!deliveryNotes) {
      return null;
    }

    return deliveryNotes.map((deliveryNote: DeliveryNote, index) =>
      <View key={ index } style={[ styles.center, { flex: 1, paddingVertical: 15 } ]}>
        <TouchableOpacity onPress={ () => this.setState({ deliveryNoteId: deliveryNote.id, editModal: true }) }>
          <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
            <Icon type="EvilIcons" style={{ color: "#e01e36" }} name="pencil" />
            <Text style={{ color: "#e01e36" }} >
              {`Katso/poista huomio ${index + 1}`}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Render add delivery note
   */
  private renderAddDeliveryNote = () => {
    return (
      <View style={[ styles.center, { flex: 1, paddingVertical: 15 } ]}>
        <TouchableOpacity onPress={ () => this.setState({ createModal: true }) }>
          <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
            <Icon type="EvilIcons" style={{ color: "#e01e36" }} name="pencil" />
            <Text style={{ color: "#e01e36" }} >
              {`Lisää huomio`}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Method for rendering fresh product quality prices
   */
  private renderFreshProductQualityPrices = () => {
    const { itemGroupCategory } = this.props;
    const { deliveryQualities } = this.state;

    if (itemGroupCategory !== ItemGroupCategory.FRESH || !deliveryQualities.length) {
      return null;
    }

    const headerBaseStyles: StyleProp<TextStyle> = {
      width: "33.33%",
      color: "#fff",
      padding: 10
    };

    return (
      <>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingTop: 15 }}>
          <View style={{ flex: 0.1 }}>
            <EntypoIcon
              name='info-with-circle'
              color='#e01e36'
              size={ 20 }
            />
          </View >
          <View style={{ flex: 1.1 }}>
            <Text style={ styles.smallHeader }>
              {`Mahdolliset laatubonukset alla, lopullinen laatuluokka varmistuu vastaanoton yhteydessä`}
            </Text>
          </View>
        </View>
        <View style={{ borderWidth: 1, borderColor: "#e01e36", borderRadius: 8 }}>
          <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#e01e36", borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
            <Text style={{ ...headerBaseStyles, borderRightWidth: 1, borderRightColor: "#fff" }}>
              {`Laatu`}
            </Text>
            <Text style={{ ...headerBaseStyles, borderRightWidth: 1, borderRightColor: "#fff" }}>
              {`ALV 0%`}
            </Text>
            <Text style={ headerBaseStyles }>
              {`ALV 14%`}
            </Text>
          </View>
          { this.renderProductQualityPriceRows() }
        </View>
      </>
    );
  }

  /**
   * Renders product quality price rows
   */
  private renderProductQualityPriceRows = () => {
    const { deliveryQualities, productId } = this.state;
    const deliveryQualitiesSorted = deliveryQualities.sort((a, b) => b.priceBonus - a.priceBonus);

    const rowBaseStyles: StyleProp<TextStyle> = {
      width: "33.33%",
      padding: 10
    };

    return deliveryQualitiesSorted.map(deliveryQuality => {
      const name = deliveryQuality.displayName;
      const priceBonus = deliveryQuality.priceBonus;
      const priceBonusVAT = roundPrice(priceBonus * 1.14);
      const active = deliveryQuality.deliveryQualityProductIds.some(id => id === productId);

      if (!active) {
        return null;
      }

      return (
        <View key={ deliveryQuality.id } style={{ flex: 1, flexDirection: "row" }}>
          <Text style={{ ...rowBaseStyles, borderRightWidth: 1, borderRightColor: "#ccc" }}>
            { name }
          </Text>
          <Text style={{ ...rowBaseStyles, borderRightWidth: 1, borderRightColor: "#ccc" }}>
            {`${ priceBonus } €/kg`}
          </Text>
          <Text style={ rowBaseStyles }>
            {`${ priceBonusVAT } €/kg`}
          </Text>
        </View>
      );
    })
  }

}

/**
 * Redux mapper for mapping store state to component props
 *
 * @param state store state
 */
function mapStateToProps(state: StoreState) {
  return {
    accessToken: state.accessToken,
    deliveries: state.deliveries,
    itemGroupCategory: state.itemGroupCategory
  };
}

/**
 * Redux mapper for mapping component dispatches
 *
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken)),
    deliveriesLoaded: (deliveries: DeliveriesState) => dispatch(actions.deliveriesLoaded(deliveries))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditDelivery);
