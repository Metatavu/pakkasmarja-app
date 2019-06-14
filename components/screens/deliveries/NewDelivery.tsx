import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct, DeliveryDataKey, DeliveryNoteData } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Picker, TouchableOpacity, TouchableHighlight, Platform, Dimensions, Alert } from "react-native";
import { Delivery, Product, DeliveryNote, DeliveryPlace, ItemGroupCategory, ProductPrice } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text, Icon } from "native-base";
import NumericInput from 'react-native-numeric-input'
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from "moment"
import DeliveryNoteModal from '../deliveries/DeliveryNoteModal'
import PakkasmarjaApi from "../../../api";
import { FileService, FileResponse } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import FeatherIcon from "react-native-vector-icons/Feather";
import ModalSelector from 'react-native-modal-selector';
import EntypoIcon from "react-native-vector-icons/Entypo";

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
  deliveryTimeOptions: { label: string, value: number }[];
  deliveryTimeValue: number;
  noteEditable: boolean;
  productPrice?: ProductPrice;
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
      deliveryTimeOptions: [{ label: "Ennen klo 12", value: 11 }, { label: "Jälkeen klo 12", value: 17 }],
      noteEditable: false,
      deliveryTimeValue: 11
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
    const productPricesService = await Api.getProductPricesService(this.props.accessToken.access_token);
    const productPrice: ProductPrice[] = await productPricesService.listProductPrices(products[0].id || "", "CREATED_AT_DESC", undefined, 1);
    const deliveries = this.getDeliveries();
    await this.setState({
      deliveryPlaces,
      deliveries,
      products,
      product: products[0],
      deliveryPlaceId: deliveryPlaces[0].id,
      productPrice: productPrice[0]
    });
    if (!this.state.productPrice) {
      this.renderAlert();
    }
  }

  static navigationOptions = ({ navigation }: any) => {
    return {
      headerTitle: <TopBar navigation={navigation}
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
  private onDeliveryNoteChange = (deliveryNoteData: DeliveryNoteData) => {
    this.setState({ deliveryNoteData: deliveryNoteData });
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
    const state: any = this.state;
    state[key] = value;
    this.setState(state);
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
   * Handles delivery submit
   */
  private handleDeliverySubmit = async () => {
    if (!this.props.accessToken || !this.state.deliveryPlaceId || !this.state.product || !this.state.product.id || !this.state.selectedDate) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    let time: string | Date = moment(this.state.selectedDate).format("YYYY-MM-DD");
    time = `${time} ${this.state.deliveryTimeValue}:00 +0000`
    time = moment(time, "YYYY-MM-DD HH:mm Z").toDate();

    const delivery: Delivery = {
      id: "",
      productId: this.state.product.id,
      userId: this.props.accessToken.userId,
      time: time,
      status: "PLANNED",
      amount: this.state.amount,
      price: this.state.price,
      deliveryPlaceId: this.state.deliveryPlaceId
    }

    if (delivery.amount > 0) {
      const createdDelivery: Delivery = await deliveryService.createDelivery(delivery);
      await Promise.all(this.state.deliveryNotes.map((deliveryNote): Promise<DeliveryNote | null> => {
        return this.createDeliveryNote(createdDelivery.id || "", deliveryNote);
      }));
      this.updateDeliveries(createdDelivery);
      this.props.navigation.navigate("IncomingDeliveries");
    }
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
   * On remove note
   */
  private onRemoveNote = () => {
    const deliveryNotes = this.state.deliveryNotes;
    const deliveryNote = this.state.deliveryNoteData;
    const newDeliveryNotes = deliveryNotes.filter((deliverynote) => {
      return deliverynote !== deliveryNote;
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
                    key: product,
                    label: product.name
                  };
                })}
                selectedKey={this.state.product}
                initValue="Valitse tuote"
                onChange={(option: any) => { this.handleProductChange(option.key) }} />
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
                  <Text style={styles.textPrediction}>{`Tämän hetkinen hinta ${this.state.productPrice.price} € / ${this.state.productPrice.unit.toUpperCase()} ALV 0%`}</Text>
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
              onChange={(value: number) => this.onUserInputChange("amount", value)}
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
                <Text style={styles.textWithSpace}>Ajankohta</Text>
              </View>
              <View style={[styles.pickerWrap, { width: "100%" }]}>
                {
                  Platform.OS !== "ios" &&
                  <Picker
                    selectedValue={this.state.deliveryTimeValue}
                    style={{ height: 50, width: "100%" }}
                    onValueChange={(itemValue) =>
                      this.onUserInputChange("deliveryTimeValue", itemValue)
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
                    onChange={(option: any) => { this.onUserInputChange("deliveryTimeValue", option.key) }} />
                }
              </View>
            </View>
            <DateTimePicker
              mode="date"
              isVisible={this.state.datepickerVisible}
              onConfirm={(date) => this.setState({ selectedDate: date, datepickerVisible: false })}
              onCancel={() => { this.setState({ datepickerVisible: false }); }}
            />
          </View>
          <View style={[styles.pickerWrap, { width: "100%", marginTop: 25 }]}>
            {
              Platform.OS !== "ios" &&
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
                onChange={(option: any) => { this.onUserInputChange("deliveryPlaceId", option.key) }} />
            }
          </View>
          <View style={{ flex: 1 }}>
            {
              this.state.deliveryNotes.length > 0 ?
                this.state.deliveryNotes.map((deliveryNoteData, index) => {
                  return (
                    <View key={index} style={[styles.center, { flex: 1, paddingVertical: 15 }]}>
                      <TouchableOpacity onPress={() => this.setState({ deliveryNoteData, noteEditable: true, modalOpen: true })}>
                        <View style={[styles.center, { flex: 1, flexDirection: "row" }]}>
                          <Icon type="EvilIcons" style={{ color: "#e01e36" }} name="pencil" />
                          <Text style={{ color: "#e01e36" }} >
                            {`Katso/poista huomio`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })
                : null
            }
            <View style={[styles.center, { flex: 1, paddingVertical: 15 }]}>
              <TouchableOpacity onPress={() =>
                this.setState({
                  deliveryNoteData: {
                    imageUri: "",
                    imageType: "",
                    text: ""
                  },
                  noteEditable: false,
                  modalOpen: true
                })}>
                <View style={[styles.center, { flex: 1, flexDirection: "row" }]}>
                  <Icon type="EvilIcons" style={{ color: "#e01e36" }} name="pencil" />
                  <Text style={{ color: "#e01e36" }} >
                    {`Lisää huomio`}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={[styles.center, { flex: 1 }]}>
              <TouchableOpacity style={[styles.deliveriesButton, styles.center, { width: "50%", height: 60, marginTop: 15 }]} onPress={this.handleDeliverySubmit}>
                <Text style={styles.buttonText}>Tallenna</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <DeliveryNoteModal
          onRemoveNote={this.onRemoveNote}
          editable={this.state.noteEditable}
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
