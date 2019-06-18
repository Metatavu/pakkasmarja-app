import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryListItem, KeyboardType, boxKey } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, Picker, TouchableOpacity, TouchableHighlight, Platform, Dimensions, Alert, StyleSheet } from "react-native";
import { Delivery, Product, DeliveryNote, DeliveryPlace, ItemGroupCategory, ProductPrice, DeliveryQuality, Contact } from "pakkasmarja-client";
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
  datepickerVisible: boolean,
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

  redBoxesLoaned: number;
  redBoxesReturned: number;
  grayBoxesLoaned: number;
  grayBoxesReturned: number;

  query?: string;
  selectedContact?: Contact;
};

/**
 * ManageDelivery
 */
class ManageDelivery extends React.Component<Props, State> {

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

      redBoxesLoaned: 0,
      redBoxesReturned: 0,
      grayBoxesLoaned: 0,
      grayBoxesReturned: 0,

      query: ""
    };
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
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const deliveryData: DeliveryListItem = this.props.navigation.state.params.deliveryListItem;
    const category: ItemGroupCategory = this.props.navigation.state.params.category;
    const isNewDelivery = this.props.navigation.state.params.isNewDelivery;
    if (!this.props.accessToken) {
      return;
    }

    this.setState({ loading: true, isNewDelivery, category });
    const Api = new PakkasmarjaApi();
    const products = await Api.getProductsService(this.props.accessToken.access_token).listProducts(undefined, category, undefined, undefined, 999);
    const deliveryPlaces = await Api.getDeliveryPlacesService(this.props.accessToken.access_token).listDeliveryPlaces();
    const deliveryQualities = await Api.getDeliveryQualitiesService(this.props.accessToken.access_token).listDeliveryQualities(category);
    const contacts = await Api.getContactsService(this.props.accessToken.access_token).listContacts();
    this.setState({
      deliveryQualities,
      products,
      deliveryPlaces,
      contacts
    });

    if (!isNewDelivery && deliveryData && deliveryData.product && deliveryData.product.id) {
      const productPrice = await Api.getProductPricesService(this.props.accessToken.access_token).listProductPrices(deliveryData.product.id, "CREATED_AT_DESC", undefined, 0);
      const deliveryPlace = deliveryPlaces.find(deliveryPlace => deliveryPlace.id === deliveryData.delivery.deliveryPlaceId);
      this.setState({
        deliveryData,
        productId: deliveryData.product.id,
        product: deliveryData.product,
        deliveryPlaceId: deliveryPlace && deliveryPlace.id,
        amount: deliveryData.delivery.amount,
        selectedDate: deliveryData.delivery.time,
        loading: false,
        productPrice: productPrice[0]
      }, this.loadDeliveryNotes);

      if (!productPrice[0]) {
        this.renderAlert();
      }
    } else {
      const productPrice = await Api.getProductPricesService(this.props.accessToken.access_token).listProductPrices(products[0].id!, "CREATED_AT_DESC", undefined, 0);
      this.setState({
        productId: products[0].id,
        product: products[0],
        deliveryPlaceId: deliveryPlaces[0].id,
        amount: 0,
        loading: false,
        productPrice: productPrice[0]
      })

      if (!productPrice[0]) {
        this.renderAlert();
      }
    }
  }

  /**
   * Handles accept delivery
   */
  private handleDeliveryAccept = async () => {
    if (!this.props.accessToken
      || !this.state.product
      || !this.state.product.id
      || !this.state.deliveryPlaceId
      || !this.state.selectedDate
    ) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const date = moment(this.state.selectedDate).utc().toDate();
    const delivery: Delivery = {
      id: this.state.isNewDelivery ? "" : this.state.deliveryData!.delivery.id,
      productId: this.state.product.id,
      userId: this.state.isNewDelivery && this.state.selectedContact ? this.state.selectedContact.id || "" : this.state.deliveryData && this.state.deliveryData.contact && this.state.deliveryData.contact.id || "",
      time: this.state.isNewDelivery ? date : new Date(),
      status: "DONE",
      amount: this.state.amount,
      deliveryPlaceId: this.state.deliveryPlaceId,
      qualityId: this.state.deliveryQualityId,
      loans: [
        { item: "RED_BOX", loaned: this.state.redBoxesLoaned, returned: this.state.redBoxesReturned },
        { item: "GRAY_BOX", loaned: this.state.grayBoxesLoaned, returned: this.state.grayBoxesReturned }
      ]
    }

    this.state.isNewDelivery
      ? await deliveryService.createDelivery(delivery)
      : await deliveryService.updateDelivery(delivery, this.state.deliveryData!.delivery.id!);
    this.props.navigation.navigate("Deliveries");
  }

  /**
   * Handles delivery reject
   */
  private handleDeliveryReject = async () => {
    if (!this.props.accessToken
      || !this.state.product
      || !this.state.product.id
      || !this.state.deliveryPlaceId
      || !this.state.deliveryData
      || !this.state.deliveryData.product
      || !this.state.deliveryData.delivery.id
      || !this.state.deliveryQualities
    ) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const delivery: Delivery = {
      id: this.state.deliveryData.delivery.id,
      productId: this.state.product.id,
      userId: this.props.accessToken.userId,
      time: new Date(),
      status: "NOT_ACCEPTED",
      amount: this.state.amount,
      deliveryPlaceId: this.state.deliveryPlaceId,
      qualityId: this.state.deliveryQualityId
    }

    await deliveryService.updateDelivery(delivery, this.state.deliveryData!.delivery.id!);
    this.props.navigation.navigate("Deliveries");
  }

  /**
   * Load delivery notes
   */
  private loadDeliveryNotes = async () => {
    if (!this.props.accessToken || !this.state.deliveryData || !this.state.deliveryData.delivery.id) {
      return;
    }
    const Api = new PakkasmarjaApi();
    const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const deliveryNotes: DeliveryNote[] = await deliveriesService.listDeliveryNotes(this.state.deliveryData.delivery.id);
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
    const products = this.state.products;
    const product = products.find((product) => product.id === productId)
    const Api = new PakkasmarjaApi();
    const productPricesService = await Api.getProductPricesService(this.props.accessToken.access_token);
    const productPrice: ProductPrice[] = await productPricesService.listProductPrices(productId, "CREATED_AT_DESC", undefined, 1);
    if (!productPrice[0]) {
      this.renderAlert();
    }
    this.setState({ product, productId, productPrice: productPrice[0] });
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
   * Find contact
   */
  private findContact = (query: any) => {
    if (query === '') {
      return [];
    }

    const { contacts } = this.state;
    const regex = new RegExp(`${query.trim()}`, 'i');
    return contacts && contacts.filter(contact => contact.displayName!.search(regex) >= 0);
  }

  /**
   * Returns whether form is valid or not
   * 
   * @return whether form is valid or not
   */
  private isValid = () => {
    return !!(this.state.product && this.state.selectedDate && this.state.deliveryQualityId && this.state.amount && this.state.deliveryPlaceId );
  }

  /**
   * Render input field
   * 
   * @param index index
   * @param key key
   * @param keyboardType keyboardType
   * @param value value
   */
  private renderInputField = (key: boxKey, keyboardType: KeyboardType, label: string) => {
    return (
      <View key={key}>
        <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
          <Text style={styles.textWithSpace}>{label}</Text>
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
          keyboardType={keyboardType}
          value={this.state[key].toString()}
          onChangeText={(text: string) => this.setState({ ...this.state, [key]: Number(text) })}
        />
      </View>
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

    const { query, selectedContact } = this.state;
    const contacts = this.findContact(query);
    const comp = (a: any, b: any) => a.toLowerCase().trim() === b.toLowerCase().trim();

    const boxInputs: { key: boxKey, label: string }[] = [{
      key: "redBoxesLoaned",
      label: "Palautettu (Punaiset laatikot)"
    },
    {
      key: "redBoxesReturned",
      label: "Lainattu (Punaiset laatikot)"
    },
    {
      key: "grayBoxesLoaned",
      label: "Palautettu (Harmaat laatikot)"
    },
    {
      key: "grayBoxesReturned",
      label: "Lainattu (Harmaat laatikot)"
    }]

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={styles.deliveryContainer}>
          {
            this.state.isNewDelivery && contacts &&
            <View>
              <Autocomplete
                autoCapitalize="none"
                autoCorrect={false}
                data={contacts.length === 1 && comp(query, contacts[0].displayName)
                  ? [] : contacts}
                defaultValue={query}
                onChangeText={(text: any) => this.setState({ query: text })}
                placeholder="Kirjoita kontaktin nimi"
                hideResults={selectedContact && selectedContact.displayName === query}
                renderItem={(contact: any) =>
                  <ListItem
                    style={{ backgroundColor: "#fff" }}
                    onPress={() => (
                      this.setState({ selectedContact: contact, query: contact.displayName })
                    )}
                  >
                    <Text>{contact.displayName}</Text>
                  </ListItem>}
              />
            </View>
          }
          <Text style={styles.textWithSpace} >Tuote</Text>
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
          <View style={{ flex: 1, flexDirection: "row", marginTop: 5 }}>
            {this.state.isNewDelivery &&
              <View style={{ flex: 1 }}>
                <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                  <Text style={styles.textWithSpace}>Toimituspäivä</Text>
                </View>
                <TouchableOpacity style={styles.pickerWrap} onPress={() => this.setState({ datepickerVisible: true })}>
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
              </View>}
            <DateTimePicker
              mode="date"
              isVisible={this.state.datepickerVisible}
              onConfirm={(date) => this.setState({ selectedDate: date, datepickerVisible: false })}
              onCancel={() => { this.setState({ datepickerVisible: false }); }}
            />
          </View>
          <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start", marginTop: 5 }}>
            <Text style={styles.textWithSpace}>Toimituspaikka</Text>
          </View>
          <View style={[styles.pickerWrap, { width: "100%" }]}>
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
          {
            this.state.category === "FROZEN" &&
            boxInputs.map(box => {
              return this.renderInputField(box.key, "numeric", box.label)
            })
          }
          <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start", marginTop: 5 }}>
            <Text style={styles.textWithSpace}>Laatu</Text>
          </View>
          <View style={[styles.pickerWrap, { width: "100%" }]}>
            {
              Platform.OS !== "ios" &&
              <Picker
                selectedValue={this.state.deliveryQualityId}
                style={{ height: 50, width: "100%" }}
                onValueChange={(itemValue) =>
                  this.setState({ deliveryQualityId: itemValue })
                }>
                <Picker.Item
                  label={"Valitse laatu"}
                  value={""}
                />
                {
                  this.state.deliveryQualities && this.state.deliveryQualities.map((deliveryQuality) => {
                    return (
                      <Picker.Item
                        key={deliveryQuality.id}
                        label={deliveryQuality.name || ""}
                        value={deliveryQuality.id}
                      />
                    );
                  })
                }
              </Picker>
            }
            {
              Platform.OS === "ios" &&
              <ModalSelector
                data={this.state.deliveryQualities && this.state.deliveryQualities.map((deliveryQuality) => {
                  return {
                    key: deliveryQuality.id,
                    label: deliveryQuality.name
                  };
                })}
                selectedKey={this.state.deliveryQualityId}
                initValue="Valitse laatu"
                onChange={(option: any) => { this.setState({ deliveryQualityId: option.key }) }} />
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
            {
              !this.state.isNewDelivery &&
              <View style={[styles.center, { flex: 1, paddingVertical: 10 }]}>
                <TouchableOpacity onPress={() => this.setState({ createModal: true })}>
                  <View style={[styles.center, { flex: 1, flexDirection: "row" }]}>
                    <IconPen size={25} style={{ color: "#e01e36" }} name="pencil" />
                    <Text style={{ fontSize: 16, color: "#e01e36" }} >
                      {`Lisää huomio`}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>}
          </View>
          {
            !this.isValid() &&
            <View style={[styles.center, { flex: 1, marginTop: 5 }]}>
              <Text style={{ color: "red" }}>Puuttuu tarvittavia tietoja</Text>
            </View>
          }
          <View style={[styles.center, { flex: 1 }]}>
            <TouchableOpacity disabled={!this.isValid()} style={[styles.deliveriesButton, styles.center, { width: "70%", height: 60, marginTop: 15 }]} onPress={this.handleDeliveryAccept}>
              <Text style={styles.buttonText}>Hyväksy toimitus</Text>
            </TouchableOpacity>
          </View>
          {
            !this.state.isNewDelivery &&
            <View style={[styles.center, { flex: 1 }]}>
              <TouchableOpacity disabled={!this.isValid()} style={[styles.declineButton, styles.center, { width: "70%", height: 60, marginTop: 15, }]} onPress={this.handleDeliveryReject}>
                <Text style={styles.buttonText}>Hylkää toimitus</Text>
              </TouchableOpacity>
            </View>
          }
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

export default connect(mapStateToProps, mapDispatchToProps)(ManageDelivery);