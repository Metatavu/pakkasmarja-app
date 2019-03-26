import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Picker, TouchableOpacity } from "react-native";
import { Delivery, Product, DeliveryStatus, DeliveryQuality, DeliveryNote, DeliveryPlace } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text, Icon } from "native-base";
import NumericInput from 'react-native-numeric-input'
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from "moment"
import DeliveryNoteModal from '../deliveries/DeliveryNoteModal'
import PakkasmarjaApi from "../../../api";
import { FileService } from "../../../api/file.service";

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
  loading: boolean;
  modalOpen: boolean;
  datepickerVisible: boolean,
  quality: DeliveryQuality;
  status: DeliveryStatus;
  products: Product[];
  id?: string;
  productId?: string;
  userId?: string;
  price: string;
  amount: number;
  time?: Date;
  selectedDate?: Date;
  deliveryPlaces?: DeliveryPlace[];
  deliveryPlace?: DeliveryPlace;
  productType?: "FRESH" | "FROZEN";
  deliveryNoteData: DeliveryNote;
  deliveryNotes: DeliveryNote[];
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
      loading: false,
      datepickerVisible: false,
      modalOpen: false,
      status: "PLANNED",
      quality: "NORMAL",
      amount: 0,
      price: "0",
      selectedDate: new Date(),
      products: [],
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

    const productType = this.props.navigation.state.params.type;

    const Api = new PakkasmarjaApi();
    const productsService = await Api.getProductsService(this.props.accessToken.access_token);
    const products: Product[] = await productsService.listProducts(undefined, productType);
    const deliveryPlacesService = await Api.getDeliveryPlacesService(this.props.accessToken.access_token);
    const deliveryPlaces = await deliveryPlacesService.listDeliveryPlaces();

    this.setState({ products, productType, deliveryPlaces, userId: this.props.accessToken.userId, productId: products[0].id, deliveryPlace: deliveryPlaces[0] });
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

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
   * Handles new delivery data
   * 
   * @param key key
   * @param value value
   */
  private onUserInputChange = (key: any, value: any) => {

    const state: any = this.state;
    state[key] = value;
    this.setState(state);
  }

  /**
   * Handles delivery submit
   */
  private handleDeliverySubmit = async () => {
    if (!this.props.accessToken || !this.state.deliveryPlace || !this.state.deliveryPlace.id || !this.state.productId || !this.state.userId || !this.state.selectedDate) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const delivery: Delivery = {
      id: this.state.id,
      productId: this.state.productId,
      userId: this.state.userId,
      time: this.state.selectedDate,
      status: "DONE",  // this.state.status == "PLANNED"
      amount: this.state.amount,
      price: this.state.price,
      quality: this.state.quality,
      deliveryPlaceId: this.state.deliveryPlace.id
    }

    console.log(this.state.productId);
    const createdDelivery = await deliveryService.createDelivery(delivery);

    if (createdDelivery.id && (this.state.deliveryNoteData.text || this.state.deliveryNoteData.image)) {
      await this.createDeliveryNotes(this.state.deliveryNotes, async (deliveryNote: DeliveryNote) => {
        await deliveryService.createDeliveryNote(deliveryNote, createdDelivery.id || "");
      });
    }

    if (this.state.deliveryNoteFile) {
      const fileService = new FileService("http://ville-local.metatavu.io:3000", this.props.accessToken.access_token);
      await fileService.uploadFile(this.state.deliveryNoteFile.fileUri, this.state.deliveryNoteFile.fileType);
    }
    const productType = await this.state.productType;
    this.props.navigation.navigate("IncomingDeliveries", { type: productType });
  }

  /**
   * Create delivery notes
   * 
   * @param deliveryNotes deliveryNotes
   * @param callback callback function
   */
  private async createDeliveryNotes(deliveryNotes: DeliveryNote[], callback: any) {
    for (let index = 0; index < deliveryNotes.length; index++) {
      await callback(deliveryNotes[index], index, deliveryNotes);
    }
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
              selectedValue={this.state.deliveryPlace}
              style={{ height: 50, width: "100%" }}
              onValueChange={(itemValue, itemIndex) =>
                this.onUserInputChange("deliveryPlace", itemValue)
              }>
              {
                this.state.deliveryPlaces && this.state.deliveryPlaces.map((deliveryPlace) => {
                  return (
                    <Picker.Item key={deliveryPlace.id} label={deliveryPlace.name || ""} value={deliveryPlace} />
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
              <TouchableOpacity style={[styles.deliveriesButton, styles.center, { width: "50%", height: 60 }]} onPress={() => { this.handleDeliverySubmit() }}>
                <Text style={styles.buttonText}>Tallenna</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <DeliveryNoteModal
          imageUri={this.state.deliveryNoteFile ? this.state.deliveryNoteFile.fileUri : undefined}
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

export default connect(mapStateToProps, mapDispatchToProps)(NewDelivery);
