import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Picker, TouchableOpacity, TouchableHighlight, Platform, Dimensions, Alert } from "react-native";
import { Delivery, Product, DeliveryNote, DeliveryPlace, ItemGroupCategory, ProductPrice } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text, Icon } from "native-base";
import NumericInput from 'react-native-numeric-input'
import moment from "moment"
import PakkasmarjaApi from "../../../api";
import FeatherIcon from "react-native-vector-icons/Feather";
import ModalSelector from 'react-native-modal-selector';
import IconPen from "react-native-vector-icons/EvilIcons";
import CreateDeliveryNoteModal from "./CreateDeliveryNoteModal";
import ViewOrDeleteNoteModal from "./ViewOrDeleteNoteModal";
import DateTimePicker from "react-native-modal-datetime-picker";
import EntypoIcon from "react-native-vector-icons/Entypo";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveries?: DeliveriesState;
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
  selectedDate?: Date;
  deliveryNotes?: DeliveryNote[];
  createModal: boolean;
  editModal: boolean;
  deliveryNoteId?: string;
  deliveryTimeOptions: { label: string, value: number }[];
  deliveryTimeValue: number;
  productPrice?: ProductPrice;
  product?: Product;
};

/**
 * Edit delivery component class
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
      price: "0",
      products: [],
      createModal: false,
      editModal: false,
      deliveryTimeOptions: [{ label: "Ennen klo 11", value: 11 }, { label: "Jälkeen klo 11", value: 17 }],
      deliveryTimeValue: 11
    };
  }

  static navigationOptions = ({ navigation }: any) => {
    return {
      headerTitle: <TopBar
        showMenu={true}
        showHeader={false}
        showUser={true}
      />,
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft:
        <TouchableHighlight onPress={() => { navigation.goBack(null) }} >
          <FeatherIcon
            name='arrow-down-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
    }
  };

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const deliveryData: DeliveryProduct = this.props.navigation.state.params.deliveryData;
    if (!this.props.accessToken || !deliveryData.product || !deliveryData.product.id) {
      return;
    }
    this.setState({ loading: true });
    const Api = new PakkasmarjaApi();
    const productsService = await Api.getProductsService(this.props.accessToken.access_token);
    const deliveryPlacesService = await Api.getDeliveryPlacesService(this.props.accessToken.access_token);
    const deliveryPlaces = await deliveryPlacesService.listDeliveryPlaces();
    const products: Product[] = await productsService.listProducts(undefined, this.props.itemGroupCategory);
    const productPricesService = await Api.getProductPricesService(this.props.accessToken.access_token);
    const productPrice: ProductPrice[] = await productPricesService.listProductPrices(deliveryData.product.id, "CREATED_AT_DESC", undefined, 0);

    if (deliveryData.product && deliveryData.delivery && deliveryData.delivery.deliveryPlaceId && deliveryData.delivery.amount) {
      const deliveryPlace = await deliveryPlacesService.findDeliveryPlace(deliveryData.delivery.deliveryPlaceId);
      const deliveryTimeValue = moment(deliveryData.delivery.time).utc().hours() > 12 ? 17 : 11;
      await this.setState({
        deliveryData,
        products: products,
        deliveryPlaces: deliveryPlaces,
        userId: this.props.accessToken.userId,
        productId: deliveryData.product.id,
        product: deliveryData.product,
        deliveryPlaceId: deliveryPlace.id || "",
        amount: deliveryData.delivery.amount,
        selectedDate: deliveryData.delivery.time,
        loading: false,
        productPrice: productPrice[0],
        deliveryTimeValue
      });
      if (!this.state.productPrice) {
        this.renderAlert();
      }
      this.loadDeliveryNotes();
    }
  }

  /**
   * Handles delivery update
   */
  private handleDeliveryUpdate = async () => {
    if (!this.props.accessToken
      || !this.state.product
      || !this.state.product.id
      || !this.state.deliveryPlaceId
      || !this.state.selectedDate
      || !this.state.deliveryData
      || !this.state.deliveryData.product
      || !this.state.deliveryData.delivery.id
      || !this.state.userId
    ) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);

    let time: string | Date = moment(this.state.selectedDate).format("YYYY-MM-DD");
    time = `${time} ${this.state.deliveryTimeValue}:00 +0000`
    time = moment(time, "YYYY-MM-DD HH:mm Z").toDate();

    const delivery: Delivery = {
      id: this.state.deliveryData.delivery.id,
      productId: this.state.product.id,
      userId: this.state.userId,
      time: time,
      status: "PLANNED",
      amount: this.state.amount,
      price: this.state.price,
      deliveryPlaceId: this.state.deliveryPlaceId || ""
    }

    const updatedDelivery = await deliveryService.updateDelivery(delivery, this.state.deliveryData.delivery.id);
    this.updateDeliveries(updatedDelivery);
    this.props.navigation.navigate("Delivery", {
      deliveryId: this.state.deliveryData.delivery.id,
      productId: this.state.productId
    });
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
    const updatedDeliveries = deliveries.map((deliveryData) => {
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

    this.props.deliveriesLoaded && this.props.deliveriesLoaded(deliveriesState)
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
    * Prints time
    * 
    * @param date
    * 
    * @return formatted start time
    */
  private printTime(date: Date): string {
    return moment(date).format("DD.MM.YYYY");
  }

  /**
   * Removes currently selected date filter
   */
  private removeDate = () => {
    this.setState({
      selectedDate: undefined
    });
  }

  /**
   * Handles product change
   */
  private handleProductChange = async (productId: string) => {
    if (!this.props.accessToken) {
      return;
    }
    this.setState({ productId });
    const products = this.state.products;
    const product = products.find((product) => product.id === productId)
    const Api = new PakkasmarjaApi();
    const productPricesService = await Api.getProductPricesService(this.props.accessToken.access_token);
    const productPrice: ProductPrice[] = await productPricesService.listProductPrices(productId, "CREATED_AT_DESC", undefined, 1);
    if (!productPrice[0]) {
      this.renderAlert();
    }
    this.setState({ product, productPrice: productPrice[0] });
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
   * Render method
   */
  public render() {
    if (this.state.loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={styles.deliveryContainer}>
          <Text style={styles.textWithSpace} >Valitse tuote</Text>
          <View style={[styles.pickerWrap, { width: "100%" }]}>
            {
              Platform.OS !== "ios" &&
              <Picker
                selectedValue={this.state.productId}
                style={{ height: 50, width: "100%" }}
                onValueChange={(itemValue, itemIndex) =>
                  this.handleProductChange(itemValue)
                }>
                {
                  this.state.products.map((product) => {
                    return (
                      <Picker.Item key={product.id} label={product.name || ""} value={product.id} />
                    );
                  })
                }
              </Picker>
            }
            {
              Platform.OS === "ios" &&
              <ModalSelector
                data={this.state.products && this.state.products.map((product) => {
                  return {
                    key: product.id,
                    label: product.name
                  };
                })}
                selectedKey={this.state.productId}
                initValue="Valitse tuote"
                onChange={(option: any) => this.handleProductChange(option.key)} />
            }
          </View>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingTop: 15 }}>
            <View style={{ flex: 0.1 }}>
              <EntypoIcon
                name='info-with-circle'
                color='#e01e36'
                size={20}
              />
            </View >
            <View style={{ flex: 1.1 }}>
              {
                this.state.productPrice ?
                  <Text style={styles.textPrediction}>{`Tämän hetkinen hinta ${this.state.productPrice.price} ${this.state.productPrice.unit}`}</Text>
                  :
                  <Text style={styles.textPrediction}>{`Tuotteelle ei löydy hintaa`}</Text>
              }
            </View>
          </View>
          <Text style={styles.textWithSpace}>Määrä ({this.state.product && this.state.product.unitName})</Text>
          <View style={[styles.center, styles.numericInputContainer]}>
            <NumericInput
              value={this.state.amount}
              initValue={this.state.amount}
              onChange={(value: number) => this.setState({ amount: value })}
              totalWidth={Dimensions.get('window').width - (styles.deliveryContainer.padding * 2) - 20}
              totalHeight={50}
              iconSize={35}
              step={10}
              valueType='real'
              minValue={0}
              textColor='black'
              iconStyle={{ color: 'white' }}
              rightButtonBackgroundColor='#e01e36'
              leftButtonBackgroundColor='#e01e36'
              borderColor='transparent'
              rounded
            />
          </View>
          <View style={{ flex: 1, flexDirection: "row", marginTop: 15 }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text>= {this.state.product && this.state.amount * (this.state.product.units * this.state.product.unitSize)} KG</Text></View>
          </View>
          <View style={{ flex: 1, flexDirection: "row", marginTop: 15 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                <Text style={styles.textWithSpace}>Toimituspäivä</Text>
              </View>
              <TouchableOpacity style={[styles.pickerWrap, { width: "98%" }]} onPress={() => this.setState({ datepickerVisible: true })}>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <View style={{ flex: 3, justifyContent: "center", alignItems: "flex-start" }}>
                    <Text style={{ paddingLeft: 10 }}>
                      {
                        this.state.selectedDate ? this.printTime(this.state.selectedDate) : "Valitse päivä"
                      }
                    </Text>
                  </View>
                  <View style={[styles.center, { flex: 0.6 }]}>
                    {this.state.selectedDate ?
                      <Icon
                        style={{ color: "#e01e36" }}
                        onPress={this.removeDate}
                        type={"AntDesign"}
                        name="close" />
                      :
                      <Icon
                        style={{ color: "#e01e36" }}
                        type="AntDesign"
                        name="calendar"
                      />
                    }
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginLeft: "4%" }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                <Text style={styles.textWithSpace}>Klo</Text>
              </View>
              <View style={[styles.pickerWrap, { width: "100%" }]}>
                {
                  Platform.OS !== "ios" &&
                  <Picker
                    selectedValue={this.state.deliveryTimeValue}
                    style={{ height: 50, width: "100%" }}
                    onValueChange={(itemValue) =>
                      this.setState({ deliveryTimeValue: itemValue })
                    }>
                    {
                      this.state.deliveryTimeOptions.map((deliveryTime) => {
                        return (
                          <Picker.Item
                            key={deliveryTime.label}
                            label={deliveryTime.label || ""}
                            value={deliveryTime.value}
                          />
                        );
                      })
                    }
                  </Picker>
                }
                {
                  Platform.OS === "ios" &&
                  <ModalSelector
                    data={this.state.deliveryTimeOptions.map((deliveryTimeOption) => {
                      return {
                        key: deliveryTimeOption.value,
                        label: deliveryTimeOption.label
                      };
                    })}
                    selectedKey={this.state.deliveryTimeValue}
                    initValue="Valitse toimituspaikka"
                    onChange={(option: any) => { this.setState({ deliveryTimeValue: option.key }) }} />
                }
              </View>
              <DateTimePicker
                mode="date"
                isVisible={this.state.datepickerVisible}
                onConfirm={(date) => this.setState({ selectedDate: date, datepickerVisible: false })}
                onCancel={() => { this.setState({ datepickerVisible: false }); }}
              />
            </View>
          </View>
          <View style={[styles.pickerWrap, { width: "100%", marginTop: 25 }]}>
            {
              Platform.OS !== "ios" &&
              <Picker
                selectedValue={this.state.deliveryPlaceId}
                style={{ height: 50, width: "100%" }}
                onValueChange={(itemValue) =>
                  this.setState({ deliveryPlaceId: itemValue })
                }>
                {
                  this.state.deliveryPlaces && this.state.deliveryPlaces.map((deliveryPlace) => {
                    return (
                      <Picker.Item
                        key={deliveryPlace.id}
                        label={deliveryPlace.name || ""}
                        value={deliveryPlace.id}
                      />
                    );
                  })
                }
              </Picker>
            }
            {
              Platform.OS === "ios" &&
              <ModalSelector
                data={this.state.deliveryPlaces && this.state.deliveryPlaces.map((deliveryPlace) => {
                  return {
                    key: deliveryPlace.id,
                    label: deliveryPlace.name
                  };
                })}
                selectedKey={this.state.deliveryPlaceId}
                initValue="Valitse toimituspaikka"
                onChange={(option: any) => { this.setState({ deliveryPlaceId: option.key }) }} />
            }
          </View>
          <View style={{ flex: 1 }}>
            {
              this.state.deliveryNotes ?
                this.state.deliveryNotes.map((deliveryNote: DeliveryNote, index) => {
                  return (
                    <View key={index} style={[styles.center, { flex: 1, paddingVertical: 10 }]}>
                      <TouchableOpacity onPress={() => this.setState({ deliveryNoteId: deliveryNote.id, editModal: true })}>
                        <View style={[styles.center, { flex: 1, flexDirection: "row" }]}>
                          <IconPen size={25} style={{ color: "#e01e36" }} name="pencil" />
                          <Text style={{ fontSize: 16, color: "#e01e36" }} >
                            {`Katso/poista huomio ${index + 1}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })
                : null
            }
            <View style={[styles.center, { flex: 1, paddingVertical: 10 }]}>
              <TouchableOpacity onPress={() => this.setState({ createModal: true })}>
                <View style={[styles.center, { flex: 1, flexDirection: "row" }]}>
                  <IconPen size={25} style={{ color: "#e01e36" }} name="pencil" />
                  <Text style={{ fontSize: 16, color: "#e01e36" }} >
                    {`Lisää huomio`}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={[styles.center, { flex: 1 }]}>
              <TouchableOpacity style={[styles.deliveriesButton, styles.center, { width: "50%", height: 60, marginTop: 15 }]} onPress={this.handleDeliveryUpdate}>
                <Text style={styles.buttonText}>Tallenna</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <CreateDeliveryNoteModal
          loadDeliveryNotes={this.loadDeliveryNotes}
          deliveryId={this.state.deliveryData && this.state.deliveryData.delivery.id || ""}
          modalClose={() => this.setState({ createModal: false })}
          modalOpen={this.state.createModal}
        />
        <ViewOrDeleteNoteModal
          loadDeliveryNotes={this.loadDeliveryNotes}
          deliveryId={this.state.deliveryData && this.state.deliveryData.delivery.id || ""}
          deliveryNoteId={this.state.deliveryNoteId || ""}
          modalClose={() => this.setState({ editModal: false })}
          modalOpen={this.state.editModal}
        />
      </BasicScrollLayout>
    );
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
    itemGroupCategory: state.itemGroupCategory,
    deliveries: state.deliveries
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
