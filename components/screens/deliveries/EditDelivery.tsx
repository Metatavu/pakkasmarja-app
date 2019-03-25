import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Picker, TouchableOpacity } from "react-native";
import { Delivery, Product, DeliveryQuality, DeliveryNote, DeliveryPlace } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text, Icon } from "native-base";
import NumericInput from 'react-native-numeric-input'
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from "moment"
import DeliveryNoteModal from '../deliveries/DeliveryNoteModal'
import PakkasmarjaApi from "../../../api";

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
  deliveryPlaces?: DeliveryPlace[];
  deliveryPlace?: DeliveryPlace;
  deliveryData?: DeliveryProduct;
  quality: DeliveryQuality;
  products: Product[];
  datepickerVisible: boolean,
  modalOpen: boolean;
  loading: boolean;
  productId?: string;
  userId?: string;
  price: string;
  beforeTime?: string;
  id?: string;
  amount: number;
  time?: Date;
  selectedDate?: Date;

  hoursTestData: number[];

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
      quality: "NORMAL",
      amount: 0,
      price: "0",
      hoursTestData: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      products: []
    };

  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const productsService = await Api.getProductsService(this.props.accessToken.access_token);
    const products: Product[] = await productsService.listProducts();
    const deliveryPlacesService = await Api.getDeliveryPlacesService(this.props.accessToken.access_token);
    const deliveryPlaces = await deliveryPlacesService.listDeliveryPlaces();
    const deliveryData: DeliveryProduct = this.props.navigation.getParam('deliveryData');
    this.setState({ deliveryData: deliveryData });
    console.log(this.state.deliveryData);


    if (deliveryData && deliveryData.product && deliveryData.delivery && deliveryData.delivery.deliveryPlaceId && deliveryData.delivery.amount) {
      const deliveryPlace = await deliveryPlacesService.findDeliveryPlace(deliveryData.delivery.deliveryPlaceId);
      this.setState({
        products: products,
        deliveryPlaces: deliveryPlaces,
        userId: this.props.accessToken.userId,
        productId: deliveryData.product.id,
        deliveryPlace: deliveryPlace,
        amount: deliveryData.delivery.amount,
        selectedDate: deliveryData.delivery.time
      });
    }

  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

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
        <View style={{ padding: 15 }}>
          <Text style={styles.textWithSpace} >Valitse tuote</Text>
          <View style={[styles.pickerWrap, { width: "100%" }]}>
            <Picker
              selectedValue={this.state.productId}
              style={{ height: 50, width: "100%" }}
              onValueChange={(itemValue, itemIndex) =>
                this.onUserInputChange("productId", itemValue)
              }>
              {
                this.state.products.map((product) => {
                  return (
                    <Picker.Item key={product.id} label={product.name || ""} value={product.id} />
                  );
                })
              }
            </Picker>
          </View>
          <Text style={styles.textWithSpace}>Tämän hetkinen hinta 4,20€/kg sis.Alv</Text>
          <Text style={styles.textWithSpace}>Määrä (KG)</Text>
          <View style={[styles.center, { width: 380, height: 70, borderRadius: 7, borderColor: "#e01e36", borderWidth: 1.25, marginBottom: 10 }]}>
            <NumericInput
              value={this.state.amount}
              initValue={this.state.amount}
              onChange={(value: number) => this.onUserInputChange("amount", value)}
              totalWidth={365}
              totalHeight={50}
              iconSize={35}
              step={100}
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
          <View style={[styles.flexView, { paddingVertical: 15 }]}>
            <View style={{ width: "47%" }}><Text>Toimituspäivä</Text></View>
            <View style={{ width: "47%" }}><Text>Klo</Text></View>
          </View>
          <View style={styles.flexView}>
            <TouchableOpacity style={[styles.pickerWrap, { width: "47%" }]} onPress={() => this.setState({ datepickerVisible: true })}>
              <View style={{ flex: 1, flexDirection: "row" }}>
                <View style={[styles.center, { flex: 3 }]}>
                  <Text>{this.state.selectedDate ? this.printTime(this.state.selectedDate) : "Valitse päivä"}</Text>
                </View>
                <View style={[styles.center, { flex: 1 }]}>
                  {this.state.selectedDate ? <Icon style={{ color: "#e01e36" }} onPress={this.removeDate} type={"AntDesign"} name="close" /> : <Icon style={{ color: "#e01e36" }} type="AntDesign" name="calendar" />}
                </View>
              </View>
            </TouchableOpacity>
            <DateTimePicker
              mode="date"
              isVisible={this.state.datepickerVisible}
              onConfirm={(date) => this.setState({ selectedDate: date, datepickerVisible: false })}
              onCancel={() => { this.setState({ datepickerVisible: false }); }}
            />
            <View style={[styles.pickerWrap, { width: "47%" }]}>
              <Picker
                selectedValue={this.state.beforeTime}
                style={{ height: 50, width: "100%" }}
                onValueChange={(itemValue) =>
                  this.onUserInputChange("beforeTime", itemValue)
                }>
                {
                  //TESTIDATAAA
                  this.state.hoursTestData.map((hour) => {
                    return (
                      <Picker.Item key={hour} label={"Ennen klo " + hour.toString() || ""} value={hour} />
                    );
                  })
                }
              </Picker>
            </View>
          </View>
          <View style={[styles.pickerWrap, { width: "100%", marginTop: 25 }]}>
            <Picker
              selectedValue={this.state.deliveryPlace ? this.state.deliveryPlace.id : ""}
              style={{ height: 50, width: "100%" }}
              onValueChange={(itemValue, itemIndex) =>
                this.onDeliveryPlaceInputChange(itemValue)
              }>
              {
                this.state.deliveryPlaces && this.state.deliveryPlaces.map((deliveryPlace) => {
                  return (
                    <Picker.Item key={deliveryPlace.id} label={deliveryPlace.name || ""} value={deliveryPlace.id} />
                  );
                })
              }
            </Picker>
          </View>
          <View style={{ flex: 1 }}>
            <View style={[styles.center, { flex: 1, paddingVertical: 15 }]}>
              <TouchableOpacity onPress={() => this.setState({ modalOpen: true })}>
                <View style={[styles.center, { flex: 1, flexDirection: "row" }]}>
                  <Icon type="EvilIcons" style={{ color: "#e01e36" }} name="pencil" /><Text style={{ color: "#e01e36" }} >Lisää huomio</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={[styles.center, { flex: 1 }]}>
              <TouchableOpacity style={[styles.deliveriesButton, styles.center, { width: "50%", height: 60 }]} onPress={this.handleDeliveryUpdate}>
                <Text style={styles.buttonText}>Tallenna</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <DeliveryNoteModal deliveryId={""} addDeliveryNote={this.addDeliveryNote} modalClose={() => this.setState({ modalOpen: false })} modalOpen={this.state.modalOpen} />
      </BasicScrollLayout>
    );
  }

  /**
   * Adds a delivery note
   */
  private addDeliveryNote = (deliveryNote: DeliveryNote) => {

    console.log('Data mitä tulee addDeliveryNote funktioon: ' + deliveryNote.image + deliveryNote.text);

  }

  /**
   * Handles new delivery data
   */
  private onUserInputChange = (key: any, value: any) => {
    const state: any = this.state;
    state[key] = value;
    this.setState(state);
  }
  /**
   * Handles new delivery data
   */
  private onDeliveryPlaceInputChange = (value: DeliveryPlace) => {
    console.log(value);
    this.setState({ deliveryPlace: value });
    console.log(this.state.deliveryPlace);
  }

  /**
   * Handles delivery update
   */
  private handleDeliveryUpdate = async () => {
    if (!this.props.accessToken || !this.state.deliveryPlace || !this.state.deliveryData || !this.state.deliveryData.product || !this.state.deliveryData.delivery.id) {
      return;
    }
    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const delivery: Delivery =
    {
      id: this.state.deliveryData.delivery.id,
      productId: this.state.productId,
      userId: this.state.userId,
      time: this.state.selectedDate,
      status: "PLANNED",
      amount: this.state.amount,
      price: this.state.price,
      quality: this.state.quality,
      deliveryPlaceId: this.state.deliveryPlace.id
    }

    const data = await deliveryService.updateDelivery(delivery, this.state.deliveryData.delivery.id);
    console.log(data);
    this.props.navigation.navigate("Delivery", {
      deliveryId: this.state.deliveryData.delivery.id,
      productId: this.state.productId
    });
  }

  /**
  * Prints time
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
}

/**
 * Redux mapper for mapping store state to component props
 * 
 * @param state store state
 */
function mapStateToProps(state: StoreState) {
  return {
    accessToken: state.accessToken
  };
}

/**
 * Redux mapper for mapping component dispatches 
 * 
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditDelivery);
