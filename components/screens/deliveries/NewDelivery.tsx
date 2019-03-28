import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct, DeliveryDataKey } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Picker, TouchableOpacity } from "react-native";
import { Delivery, Product, DeliveryQuality, DeliveryNote, DeliveryPlace, ItemGroupCategory } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text, Icon } from "native-base";
import NumericInput from 'react-native-numeric-input'
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from "moment"
import DeliveryNoteModal from '../deliveries/DeliveryNoteModal'
import PakkasmarjaApi from "../../../api";
import { FileService } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';

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
  deliveryNoteData: any;
  deliveryNotes: DeliveryNote[];
  products: Product[];
  deliveryNoteFile?: {
    fileUri: string,
    fileType: string
  };
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
      price: "0",
      deliveries: [],
      selectedDate: new Date(),
      deliveryNoteData: {
        id: undefined,
        image: undefined,
        text: undefined
      },
      deliveryNotes: [],
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
    const products: Product[] = await productsService.listProducts(undefined, this.props.itemGroupCategory);
    const deliveryPlacesService = await Api.getDeliveryPlacesService(this.props.accessToken.access_token);
    const deliveryPlaces = await deliveryPlacesService.listDeliveryPlaces();

    const deliveries = this.getDeliveries();
    this.setState({
      deliveryPlaces,
      deliveries,
      products,
      productId: products[0].id,
      deliveryPlaceId: deliveryPlaces[0].id
    });
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
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
   * Adds a delivery note
   * 
   * @param deliveryNoteData deliveryNoteData
   */
  private onDeliveryNoteChange = (deliveryNoteData: any) => {
    this.setState({ deliveryNoteData: deliveryNoteData });
  }

  /**
   * On create note click
   */
  private onCreateNoteClick = () => {
    const noteData = this.state.deliveryNoteData;
    const notes = this.state.deliveryNotes;
    notes.push(noteData);

    this.setState({ deliveryNotes: notes, deliveryNoteData: {} });
  }

  /**
   * Handles new delivery data
   * 
   * @param key key
   * @param value value
   */
  private onUserInputChange = (key: DeliveryDataKey, value: string | number) => {
    const state: any = this.state;
    state[key] = value;
    this.setState(state);
  }

  /**
   * Handles delivery submit
   */
  private handleDeliverySubmit = async () => {
    if (!this.props.accessToken || !this.state.deliveryPlaceId || !this.state.productId || !this.state.selectedDate) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);

    const delivery: Delivery = {
      id: "",
      productId: this.state.productId,
      userId: this.props.accessToken.userId,
      time: this.state.selectedDate,
      status: "PLANNED",
      amount: this.state.amount,
      price: this.state.price,
      quality: "NORMAL",
      deliveryPlaceId: this.state.deliveryPlaceId
    }

    const createdDelivery = await deliveryService.createDelivery(delivery);

    if (createdDelivery.id) {
      await this.createDeliveryNotes(this.state.deliveryNotes, async (deliveryNote: any) => {
        let file;
        if (deliveryNote.imageUri && this.props.accessToken) {
          const fileService = new FileService(REACT_APP_API_URL, this.props.accessToken.access_token);
          file = await fileService.uploadFile(deliveryNote.imageUri, deliveryNote.imageType);
        }

        const note: DeliveryNote = {
          text: deliveryNote.text,
          image: file ? file.url : undefined
        };

        await deliveryService.createDeliveryNote(note, createdDelivery.id || "");
      });
    }

    this.updateDeliveries(createdDelivery);
    this.props.navigation.navigate("IncomingDeliveries");
  }

  /**
   * Create delivery notes
   * 
   * @param deliveryNotes deliveryNotes
   * @param callback callback function
   */
  private async createDeliveryNotes(deliveryNotes: any[], callback: any) {
    for (let index = 0; index < deliveryNotes.length; index++) {
      await callback(deliveryNotes[index], index, deliveryNotes);
    }
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

  /**
   * On delivery note image change
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
                this.state.products && this.state.products.map((product) => {
                  return (
                    <Picker.Item
                      key={product.id}
                      label={product.name}
                      value={product.id}
                    />
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
            <DateTimePicker
              mode="date"
              isVisible={this.state.datepickerVisible}
              onConfirm={(date) => this.setState({ selectedDate: date, datepickerVisible: false })}
              onCancel={() => { this.setState({ datepickerVisible: false }); }}
            />
          </View>
          <View style={[styles.pickerWrap, { width: "100%", marginTop: 25 }]}>
            <Picker
              selectedValue={this.state.deliveryPlaceId}
              style={{ height: 50, width: "100%" }}
              onValueChange={(itemValue) =>
                this.onUserInputChange("deliveryPlaceId", itemValue)
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
              <TouchableOpacity style={[styles.deliveriesButton, styles.center, { width: "50%", height: 60 }]} onPress={this.handleDeliverySubmit}>
                <Text style={styles.buttonText}>Tallenna</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <DeliveryNoteModal
          imageUri={this.state.deliveryNoteData ? this.state.deliveryNoteData.imageUri : undefined}
          onCreateNoteClick={this.onCreateNoteClick}
          deliveryNoteData={this.state.deliveryNoteData}
          onDeliveryNoteChange={this.onDeliveryNoteChange}
          onDeliveryNoteImageChange={((fileUri, fileType) => this.onDeliveryNoteImageChange(fileUri, fileType))}
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
