import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState, DeliveryDataKey } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Picker, TouchableOpacity } from "react-native";
import { Delivery, Product, DeliveryNote, DeliveryPlace, ItemGroupCategory } from "pakkasmarja-client";
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
  deliveryNoteData: DeliveryNote;
  deliveryNotes: DeliveryNote[];
  deliveryNoteFile?: {
    fileUri: string,
    fileType: string
  };
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
      deliveryNoteData: {
        id: undefined,
        image: undefined,
        text: undefined
      },
      deliveryNotes: []
    };

  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }
    this.setState({ loading: true });
    const deliveryData: DeliveryProduct = this.props.navigation.state.params.deliveryData;

    const Api = new PakkasmarjaApi();
    const productsService = await Api.getProductsService(this.props.accessToken.access_token);
    const deliveriesService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const deliveryNotes = await deliveriesService.listDeliveryNotes(deliveryData.delivery.id || "");
    const deliveryPlacesService = await Api.getDeliveryPlacesService(this.props.accessToken.access_token);
    const deliveryPlaces = await deliveryPlacesService.listDeliveryPlaces();
    const products: Product[] = await productsService.listProducts(undefined, this.props.itemGroupCategory);

    this.setState({
      deliveryData,
      deliveryNotes
    });

    if (deliveryData.product && deliveryData.delivery && deliveryData.delivery.deliveryPlaceId && deliveryData.delivery.amount) {
      const deliveryPlace = await deliveryPlacesService.findDeliveryPlace(deliveryData.delivery.deliveryPlaceId);
      this.setState({
        products: products,
        deliveryPlaces: deliveryPlaces,
        userId: this.props.accessToken.userId,
        productId: deliveryData.product.id,
        deliveryPlaceId: deliveryPlace.id || "",
        amount: deliveryData.delivery.amount,
        selectedDate: deliveryData.delivery.time,
        loading: false
      });
    }
  }

  /**
   * Handles new delivery data
   */
  private onUserInputChange = (key: DeliveryDataKey, value: string | number) => {
    const state: any = this.state;
    state[key] = value;
    this.setState(state);
  }

  /**
   * Handles delivery update
   */
  private handleDeliveryUpdate = async () => {
    if (!this.props.accessToken || !this.state.deliveryPlaceId || !this.state.selectedDate || !this.state.deliveryData || !this.state.deliveryData.product || !this.state.deliveryData.delivery.id) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const delivery: Delivery = {
      id: this.state.deliveryData.delivery.id,
      productId: this.state.productId || "",
      userId: this.state.userId || "",
      time: this.state.selectedDate,
      status: "PLANNED",
      amount: this.state.amount,
      price: this.state.price,
      quality: "NORMAL",
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
   * Adds a delivery note
   * 
   * @param deliveryNote deliveryNote
   */
  private onDeliveryNoteChange = (deliveryNote: DeliveryNote) => {
    this.setState({ deliveryNoteData: deliveryNote });
  }

  /**
   * On create note click
   */
  private onCreateNoteClick = () => {
    const noteData = this.state.deliveryNoteData;
    const notes = this.state.deliveryNotes;
    notes.push(noteData);

    this.setState({ deliveryNotes: notes });
  }

  /**
   * On delivery note image change
   * 
   * @param fileUri fileUri
   * @param fileType fileType
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
          <View style={[styles.center, styles.numericInputContainer]}>
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
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
              <Text style={styles.textWithSpace}>Toimituspäivä</Text>
            </View>
            <TouchableOpacity style={[styles.pickerWrap, { width: "100%" }]} onPress={() => this.setState({ datepickerVisible: true })}>
              <View style={{ flex: 1, flexDirection: "row" }}>
                <View style={{ flex: 3, justifyContent: "center", alignItems: "flex-start" }}>
                  <Text style={{ paddingLeft: 10 }}>{this.state.selectedDate ? this.printTime(this.state.selectedDate) : "Valitse päivä"}</Text>
                </View>
                <View style={[styles.center, { flex: 0.6 }]}>
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
          </View>
          <View style={[styles.pickerWrap, { width: "100%", marginTop: 25 }]}>
            <Picker
              selectedValue={this.state.deliveryPlaceId ? this.state.deliveryPlaceId : ""}
              style={{ height: 50, width: "100%" }}
              onValueChange={(itemValue, itemIndex) =>
                this.onUserInputChange("deliveryPlaceId", itemValue)
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
                  <Icon type="EvilIcons" style={{ color: "#e01e36" }} name="pencil" />
                  <Text style={{ color: "#e01e36" }} >
                    {`Lisää huomio (${this.state.deliveryNotes.length})`}
                  </Text>
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
        <DeliveryNoteModal
          imageUri={this.state.deliveryNoteFile ? this.state.deliveryNoteFile.fileUri : undefined}
          onDeliveryNoteImageChange={((fileUri, fileType) => this.onDeliveryNoteImageChange(fileUri, fileType))}
          onCreateNoteClick={this.onCreateNoteClick}
          deliveryNoteData={this.state.deliveryNoteData}
          onDeliveryNoteChange={this.onDeliveryNoteChange}
          modalClose={() => this.setState({ modalOpen: false })}
          modalOpen={this.state.modalOpen}
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
