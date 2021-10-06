import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct, DeliveryDataKey, DeliveryNoteData } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Picker, TouchableOpacity, TouchableHighlight, Platform, Dimensions, Alert, StyleProp, TextStyle, ViewStyle } from "react-native";
import Api, { Delivery, Product, DeliveryNote, DeliveryPlace, ItemGroupCategory, ProductPrice, OpeningHourInterval, DeliveryQuality } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text, Icon, H2, H1 } from "native-base";
import NumericInput from 'react-native-numeric-input'
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from "moment";
import DeliveryNoteModal from '../deliveries/DeliveryNoteModal'
import PakkasmarjaApi from "../../../api";
import { FileService, FileResponse } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import FeatherIcon from "react-native-vector-icons/Feather";
import ModalSelector from 'react-native-modal-selector';
import EntypoIcon from "react-native-vector-icons/Entypo";
import { extendMoment } from "moment-range";
import _ from "lodash";
import { roundPrice } from "../../../utils/utility-functions";
import AsyncButton from "../../generic/async-button";

const Moment = require("moment");
const extendedMoment = extendMoment(Moment);
extendedMoment.locale("fi");

/**
 * Component props
 */
interface Props {
  navigation: any;
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
  loading: boolean;
  modalOpen: boolean;
  datepickerVisible: boolean,
  productId?: string;
  price: string;
  amount: number;
  deliveries: DeliveryProduct[];
  selectedDate?: Date;
  deliveryPlaces?: DeliveryPlace[];
  deliveryPlaceId?: string;
  deliveryNoteData: DeliveryNoteData;
  deliveryNotes: DeliveryNoteData[];
  products: Product[];
  product?: Product;
  deliveryNoteFile?: {
    fileUri: string,
    fileType: string
  };
  deliveryPlaceOpeningHours?: OpeningHourInterval[];
  defaultOpeningHours: OpeningHourInterval[];
  selectedTime?: Date;
  noteEditable: boolean;
  productPrice?: ProductPrice;
  deliveryQualities: DeliveryQuality[];
};

/**
 * New delivery component class
 */
class NewDelivery extends React.Component<Props, State> {

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      products: [],
      loading: false,
      datepickerVisible: false,
      modalOpen: false,
      amount: 0,
      price: "",
      deliveries: [],
      selectedDate: new Date(),
      deliveryNoteData: {
        imageUri: "",
        imageType: "",
        text: ""
      },
      deliveryNotes: [],
      noteEditable: false,
      deliveryPlaceOpeningHours: [],
      defaultOpeningHours: [{
        opens: moment().startOf("day").toDate(),
        closes: moment().endOf("day").toDate()
      }],
      deliveryQualities: []
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const { accessToken } = this.props;
    const { selectedDate } = this.state;

    if (!accessToken) {
      return;
    }

    this.setState({ loading: true });
    const Api = new PakkasmarjaApi();
    const productsService = Api.getProductsService(accessToken.access_token);
    const productPricesService = Api.getProductPricesService(accessToken.access_token);
    const deliveryPlacesService = Api.getDeliveryPlacesService(accessToken.access_token);
    const deliveryQualitiesService = Api.getDeliveryQualitiesService(accessToken.access_token);

    const [ unfilteredProducts, deliveryPlaces ] = await Promise.all([
      productsService.listProducts(undefined, this.props.itemGroupCategory, accessToken.userId, undefined, 999),
      deliveryPlacesService.listDeliveryPlaces()
    ]);

    const products = unfilteredProducts.filter(product => product.active === true);
    const deliveries = this.getDeliveries();

    const [ productPrice, deliveryQualities ] = await Promise.all([
      products[0] ? await productPricesService.listProductPrices(products[0].id || "", "CREATED_AT_DESC", undefined, undefined, 1) : [],
      deliveryQualitiesService.listDeliveryQualities(ItemGroupCategory.FRESH, products[0].id || "")
    ]);

    this.setState({
      deliveryPlaces: deliveryPlaces.filter(deliveryPlace => deliveryPlace.id !== "OTHER"),
      deliveries,
      products,
      productId: products[0] ? products[0].id : undefined,
      product: products[0] ? products[0] : undefined,
      deliveryPlaceId: deliveryPlaces[0].id,
      productPrice: productPrice[0],
      deliveryQualities,
      loading: false,
    });

    if (products[0] && !productPrice[0]) {
      this.renderAlert();
    }


    if (selectedDate && deliveryPlaces[0].id) {
      this.getDeliveryPlaceOpeningHours(selectedDate, deliveryPlaces[0].id);
    }
  }

  /**
   * Component did update life cycle method
   *
   * @param prevProps previous props
   * @param prevState previous state
   */
  public componentDidUpdate = (prevProps: Props, prevState: State) => {
    const { deliveryPlaceId, selectedDate } = this.state;

    if (
      selectedDate &&
      deliveryPlaceId &&
      (prevState.selectedDate !== selectedDate || prevState.deliveryPlaceId !== deliveryPlaceId)
    ) {
      this.getDeliveryPlaceOpeningHours(selectedDate, deliveryPlaceId);
    }
  }

  /**
   * Navigation options of current route
   */
  static navigationOptions = ({ navigation }: any) => {
    return {
      headerTitle: <TopBar navigation={ navigation } showMenu showUser/>,
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft:
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
   * Gets delivery place opening hours on a given date
   *
   * @param date date object
   * @param deliveryPlaceId delivery place id
   */
  private getDeliveryPlaceOpeningHours = async (date: Date, deliveryPlaceId: string) => {
    const { accessToken } = this.props;
    const { defaultOpeningHours } = this.state;
    if (!accessToken || !accessToken.access_token) {
      return;
    }

    try {
      const openingHoursService = Api.getOpeningHoursService(accessToken.access_token);
      const rangeStart = moment(date).startOf("day").toDate();
      const rangeEnd = moment(date).endOf("day").toDate();
      const openingHourPeriods = await openingHoursService.listOpeningHourPeriods(deliveryPlaceId, rangeStart, rangeEnd);
      const openingHourExceptions = await openingHoursService.listOpeningHourExceptions(deliveryPlaceId);
      const chosenDate = moment(date);
      const exception = openingHourExceptions.find(item => {
        const exceptionDate = moment(item.exceptionDate);
        return exceptionDate.format("YYYY-MM-DD") === chosenDate.format("YYYY-MM-DD");
      });
      const period = openingHourPeriods.find(period => {
        const periodBegin = moment(period.beginDate);
        const periodEnd = moment(period.endDate);
        const sameAsBegin = chosenDate.format("YYYY-MM-DD") === periodBegin.format("YYYY-MM-DD");
        const sameAsEnd = chosenDate.format("YYYY-MM-DD") === periodEnd.format("YYYY-MM-DD");
        return chosenDate.isBetween(periodBegin, periodEnd) || sameAsBegin || sameAsEnd;
      });
      if (exception) {
        this.setState({
          deliveryPlaceOpeningHours: exception.hours,
          selectedTime: exception.hours[0].opens
        });
      } else if (period) {
        const periodDay = period.weekdays.find((item, index) => {
          const day = moment(period.beginDate).add(index, "days");
          return day.format("YYYY-MM-DD") === chosenDate.format("YYYY-MM-DD");
        });
        if (periodDay) {
          this.setState({
            deliveryPlaceOpeningHours: periodDay.hours,
            selectedTime: periodDay.hours[0].opens
          });
        } else {
          this.setState({
            deliveryPlaceOpeningHours: undefined,
            selectedTime: defaultOpeningHours[0].opens
          });
        }
      } else {
        this.setState({
          deliveryPlaceOpeningHours: undefined,
          selectedTime: defaultOpeningHours[0].opens
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Adds a delivery note
   *
   * @param deliveryNoteData deliveryNoteData
   */
  private onDeliveryNoteChange = (deliveryNoteData: DeliveryNoteData) => {
    this.setState({ deliveryNoteData });
  }

  /**
   * On create note click
   */
  private onCreateNoteClick = () => {
    const noteData = this.state.deliveryNoteData;
    const notes = this.state.deliveryNotes;
    notes.push(noteData);

    this.setState({
      deliveryNotes: notes,
      deliveryNoteData: {
        imageUri: "",
        imageType: "",
        text: ""
      }
    });
  }

  /**
   * Handles new delivery data
   *
   * @param key key
   * @param value value
   */
  private onUserInputChange = async (key: DeliveryDataKey, value: string | number) => {
    this.setState({ ...this.state, [key]: value });
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
    const productPricesService = Api.getProductPricesService(accessToken.access_token);
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
   * Handles delivery submit
   */
  private handleDeliverySubmit = async () => {
    const { accessToken, navigation } = this.props;
    const {
      deliveryPlaceId,
      product,
      selectedDate,
      selectedTime,
      amount,
      price,
      deliveryNotes
    } = this.state;

    if (!accessToken || !deliveryPlaceId || !product || !product.id || !selectedDate) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = Api.getDeliveriesService(accessToken.access_token);
    const deliveryTime = moment(selectedTime);
    const time = moment(selectedDate)
      .set({ "hour": deliveryTime.hour(), "minute": deliveryTime.minute() })
      .toDate();

    const delivery: Delivery = {
      productId: product.id,
      userId: accessToken.userId,
      time: time,
      status: "PLANNED",
      amount: amount,
      price: price,
      deliveryPlaceId: deliveryPlaceId
    }

    const createdDelivery: Delivery = await deliveryService.createDelivery(delivery);
    if (deliveryNotes.length > 0) {
      await Promise.all(deliveryNotes.map((deliveryNote): Promise<DeliveryNote | null> => {
        return this.createDeliveryNote(createdDelivery.id || "", deliveryNote);
      }));
    }
    this.updateDeliveries(createdDelivery);
    navigation.navigate("IncomingDeliveries");
  }

  /**
   * Create delivery notes
   *
   * @param deliveryId deliveryId
   * @param deliveryNote deliveryNote
   */
  private async createDeliveryNote(deliveryId: string, deliveryNoteData: DeliveryNoteData): Promise<DeliveryNote | null> {
    if (this.props.accessToken) {
      const fileService = new FileService(REACT_APP_API_URL, this.props.accessToken.access_token);
      let image: FileResponse | undefined = undefined;

      if (deliveryNoteData.imageUri && deliveryNoteData.imageType) {
        image = await fileService.uploadFile(deliveryNoteData.imageUri, deliveryNoteData.imageType);
      }

      const deliveryNote: DeliveryNote = {
        text: deliveryNoteData.text,
        image: image ? image.url : undefined
      };

      const Api = new PakkasmarjaApi();
      const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);
      return deliveryService.createDeliveryNote(deliveryNote, deliveryId || "");
    }

    return null;
  }

  /**
   * Update deliveries
   */
  private updateDeliveries = (delivery: Delivery) => {
    if (!this.props.deliveries) {
      return;
    }

    const deliveries = this.getDeliveries();
    const deliveryProduct: DeliveryProduct = {
      delivery: delivery,
      product: this.state.products.find(product => product.id === delivery.productId)
    };

    deliveries.push(deliveryProduct);
    const deliveriesState = this.props.deliveries;

    if (this.props.itemGroupCategory === "FROZEN") {
      deliveriesState.frozenDeliveryData = deliveries;
    } else {
      deliveriesState.freshDeliveryData = deliveries;
    }

    this.props.deliveriesLoaded && this.props.deliveriesLoaded(deliveriesState)
  }

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
   * Removes currently selected date filter
   */
  private removeDate = () => {
    this.setState({
      selectedDate: undefined,
      selectedTime: undefined,
      deliveryPlaceOpeningHours: undefined
    });
  }

  /**
   * On delivery note image change
   *
   * @param fileUri file uri
   * @param fileType file type
   */
  private onDeliveryNoteImageChange = (fileUri?: string, fileType?: string) => {
    if (!fileUri || !fileType) {
      this.setState({ deliveryNoteFile: undefined });
      return;
    }

    this.setState({
      deliveryNoteFile: {
        fileUri: fileUri,
        fileType: fileType
      }
    });
  }

  /**
   * Gets opening hours if selected delivery place has ones set for selected date
   *
   * @returns date array if opening hours are found, otherwise undefined
   */
  private getOpeningHours = (): Date[] => {
    const { deliveryPlaceOpeningHours, defaultOpeningHours } = this.state;
    return deliveryPlaceOpeningHours ?
      this.convertToDateArray(deliveryPlaceOpeningHours) :
      this.convertToDateArray(defaultOpeningHours);
  }

  /**
   * Converts opening hours to date array
   *
   * @param openingHours array of opening hours
   * @return array of dates
   */
  private convertToDateArray = (openingHours: OpeningHourInterval[]) => {
    return _.flatten(openingHours.map(this.mapToDateArray));
  }

  /**
   * Maps single opening hour interval to date array
   *
   * @param interval opening hour interval
   * @returns array of dates
   */
  private mapToDateArray = (interval: OpeningHourInterval): Date[] => {
    const { opens, closes } = interval;
    const dateRange = extendedMoment.range(
      moment(opens),
      moment(closes)
    );
    const momentDateArray = Array.from(dateRange.by("minutes", { step: 15, excludeEnd: true }));
    return momentDateArray.map(date => date.toDate());
  }

  /**
   * Checks if time of day matches
   */
  private matchTime = (a: Date | undefined, b: Date | undefined) => {
    return a && b ?
      moment(a).format("HH.mm") === moment(b).format("HH.mm") :
      false;
  }

  /**
   * On remove note
   */
  private onRemoveNote = () => {
    const deliveryNotes = this.state.deliveryNotes;
    const deliveryNote = this.state.deliveryNoteData;
    const newDeliveryNotes = deliveryNotes.filter((note) => {
      return note !== deliveryNote;
    });
    this.setState({ deliveryNotes: newDeliveryNotes, modalOpen: false });
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
    return !!(this.state.product
      && this.state.selectedDate
      && this.state.deliveryPlaceId
      && this.state.selectedTime
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
      noteEditable,
      deliveryNoteData,
      deliveryPlaceOpeningHours,
      modalOpen } = this.state;

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
              onChange={ (value: number) => this.onUserInputChange("amount", value) }
              totalWidth={ Dimensions.get('window').width - (styles.deliveryContainer.padding * 2) - 20 }
              totalHeight={ 50 }
              iconSize={ 35 }
              step={ 10 }
              valueType='real'
              minValue={ 0 }
              textColor='black'
              iconStyle={{ color: 'white' }}
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
              {
                this.renderDeliveryDateSelection()
              }
            </View>
            <View style={{ flex: 1, marginLeft: "4%" }}>
              {
                this.renderDeliveryTimeSelection()
              }
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: "row", marginTop: 15, justifyContent: "center" }}>
            { !deliveryPlaceOpeningHours &&
              <Text style={{ color: "red" }}>Aukioloajat voivat vielä muuttua</Text>
            }
          </View>
          <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
            <Text style={ styles.textWithSpace }>Toimituspaikka</Text>
          </View>
          <View style={[ styles.pickerWrap, { width: "100%" } ]}>
            {
              this.renderDeliveryPlaceSelection()
            }
          </View>
          <View style={{ flex: 1 }}>
            {
              this.renderDeliveryNotes()
            }
            {
              this.renderAddDeliveryNote()
            }
            {
              !this.isValid() &&
              <View style={[ styles.center, { flex: 1, marginTop: 5 } ]}>
                <Text style={{ color: "red" }}>Tarvittavia tietoja puuttuu</Text>
              </View>
            }
            <View style={[ styles.center, { flex: 1 } ]}>
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
        <DeliveryNoteModal
          onRemoveNote={ this.onRemoveNote }
          editable={ noteEditable }
          imageUri={ deliveryNoteData ? deliveryNoteData.imageUri : undefined }
          onCreateNoteClick={ this.onCreateNoteClick }
          deliveryNoteData={ deliveryNoteData }
          onDeliveryNoteChange={ this.onDeliveryNoteChange }
          onDeliveryNoteImageChange={ ((fileUri, fileType) => this.onDeliveryNoteImageChange(fileUri, fileType)) }
          modalClose={ () => this.setState({ modalOpen: false }) }
          modalOpen={ modalOpen }
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
          style={{ height: 50, width: "100%" }}
          onValueChange={(itemValue, itemIndex) =>
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
    const { datepickerVisible } = this.state;
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
                { this.state.selectedDate ?
                  this.printDate(this.state.selectedDate) :
                  "Valitse päivä"
                }
              </Text>
            </View>
            <View style={[ styles.center, { flex: 0.6 } ]}>
              { this.state.selectedDate ?
                <Icon
                  style={{ color: "#e01e36" }}
                  onPress={ this.removeDate }
                  type="AntDesign"
                  name="close"
                /> :
                <Icon
                  style={{ color: "#e01e36" }}
                  type="AntDesign"
                  name="calendar"
                />
              }
            </View>
          </View>
        </TouchableOpacity>
        <DateTimePicker
          date={ this.state.selectedDate }
          mode="date"
          isVisible={ datepickerVisible }
          onConfirm={ date => this.setState({ selectedDate: date, datepickerVisible: false }) }
          onCancel={ () => this.setState({ datepickerVisible: false }) }
        />
      </>
    );
  }

  /**
   * Renders delivery time selection
   */
  private renderDeliveryTimeSelection = () => {
    const includedHours = this.getOpeningHours();

    return (
      <>
        <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={ styles.textWithSpace }>Ajankohta</Text>
        </View>
        <View style={[ styles.pickerWrap, { width: "100%" } ]}>
          { includedHours.length > 0 ?
            this.renderTimePicker(includedHours) :
            <Text style={{ flex: 1, textAlignVertical: "center", paddingLeft: 5 }}>Suljettu</Text>
          }
        </View>
      </>
    );
  }

  /**
   * Renders time picker element
   *
   * @param hours included hours list
   */
  private renderTimePicker = (hours: Date[]) => {
    const { selectedTime } = this.state;
    if (Platform.OS !== "ios") {
      return (
        <Picker
          selectedValue={ hours.find(time => this.matchTime(time, selectedTime)) }
          style={{ height: 50, width: "100%" }}
          onValueChange={ itemValue => this.onUserInputChange("selectedTime", itemValue) }
        >
          {
            (hours || []).map(time => {
              const timeString = this.printTime(time);
              return (
                <Picker.Item
                  key={ timeString }
                  label={ timeString }
                  value={ time }
                />
              );
            })
          }
        </Picker>
      );
    }

    return (
      <ModalSelector
        data={
          (hours || []).map(time => {
            const timeString = this.printTime(time);
            return {
              key: time,
              label: timeString
            };
          })
        }
        selectedKey={ hours.find(time => this.matchTime(time, selectedTime)) }
        initValue="Valitse toimitusaika"
        onChange={ (option: any) => this.onUserInputChange("selectedTime", option.key) }
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
          style={{ height: 50, width: "100%" }}
          onValueChange={ itemValue => this.onUserInputChange("deliveryPlaceId", itemValue) }
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
          onChange={ (option: any) => this.onUserInputChange("deliveryPlaceId", option.key) }
        />
      );
    }
  }

  /**
   * Renders delivery notes
   */
  private renderDeliveryNotes = () => {
    const { deliveryNotes } = this.state;
    if (deliveryNotes.length < 1) {
      return null;
    }

    return deliveryNotes.map((deliveryNoteData, index) =>
      <View key={ index } style={[ styles.center, { flex: 1, paddingVertical: 15 } ]}>
        <TouchableOpacity onPress={ () => this.setState({ deliveryNoteData, noteEditable: true, modalOpen: true }) }>
          <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
            <Icon type="EvilIcons" style={{ color: "#e01e36" }} name="pencil" />
            <Text style={{ color: "#e01e36" }} >
              {`Katso/poista huomio`}
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
        <TouchableOpacity
          onPress={ () =>
            this.setState({
              noteEditable: false,
              modalOpen: true,
              deliveryNoteData: {
                imageUri: "",
                imageType: "",
                text: ""
              }
            })
          }
        >
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
        <View style={{ flex: 1, flexDirection: "row" }}>
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

export default connect(mapStateToProps, mapDispatchToProps)(NewDelivery);
