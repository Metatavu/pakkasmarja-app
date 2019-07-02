import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryListItem } from "../../../types";
import * as actions from "../../../actions";
import { View, TouchableHighlight, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import FeatherIcon from "react-native-vector-icons/Feather";
import * as _ from "lodash";
import PakkasmarjaApi from "../../../api";
import { Tabs, Tab, Picker } from "native-base";
import { styles } from "../deliveries/styles.tsx";
import { ItemGroupCategory, Delivery, Contact, Product, DeliveryPlace } from "pakkasmarja-client";
import moment from "moment";
import DateTimePicker from "react-native-modal-datetime-picker";
import { Text } from "native-base";
import ModalSelector from 'react-native-modal-selector';

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
  category: ItemGroupCategory;
  date: Date;
  freshDeliveries?: Delivery[];
  frozenDeliveries?: Delivery[];
  datepickerVisible: boolean;
  contacts?: Contact[];
  products?: Product[];
  deliveryPlaces: DeliveryPlace[];
  selectedDeliveryPlaceId: string;
};

/**
 * Manage deliveries
 */
class ManageDeliveries extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      category: "FRESH",
      date: new Date(),
      datepickerVisible: false,
      deliveryPlaces: [],
      selectedDeliveryPlaceId: ""
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
    if (!this.props.accessToken) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const products = await Api.getProductsService(this.props.accessToken.access_token).listProducts(undefined, undefined, undefined, undefined, 999);
    let deliveryPlaces = await Api.getDeliveryPlacesService(this.props.accessToken.access_token).listDeliveryPlaces();
    const receiveFromPlaceCode = this.props.accessToken.receiveFromPlaceCode;

    if (receiveFromPlaceCode) {
      deliveryPlaces = deliveryPlaces.filter(deliveryPlace => deliveryPlace.id === receiveFromPlaceCode);
      if (deliveryPlaces.length === 1) {
        this.setState({ selectedDeliveryPlaceId: receiveFromPlaceCode });
      }
    }

    this.setState({ products, deliveryPlaces }, () => this.loadData());
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.date !== this.state.date || prevState.selectedDeliveryPlaceId !== this.state.selectedDeliveryPlaceId) {
      this.loadData();
    }
  }

  /**
   * Render method
   */
  public render() {
    const canManageFreshDeliveries = this.props.accessToken ? this.props.accessToken.realmRoles.indexOf("receive_fresh_berries") > -1 : false;
    const canManageFrozenDeliveries = this.props.accessToken ? this.props.accessToken.realmRoles.indexOf("receive_frozen_berries") > -1 : false;
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <Tabs tabBarUnderlineStyle={{ backgroundColor: "#fff" }}>
          {
            canManageFreshDeliveries &&
            <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} activeTextStyle={styles.activeText} textStyle={{ color: "#fff" }} tabStyle={styles.tab} heading={"TUORE"}>
              {
                this.renderDeliveryList("FRESH")
              }
            </Tab>
          }
          {
            canManageFrozenDeliveries &&
            <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} activeTextStyle={styles.activeText} textStyle={{ color: "#fff" }} tabStyle={styles.tab} heading={"PAKASTE"}>
              {
                this.renderDeliveryList("FROZEN")
              }
            </Tab>}
        </Tabs>
      </BasicScrollLayout>
    );
  }

  /**
   * Load data
   */
  private loadData = async () => {
    if (!this.props.accessToken) {
      return;
    }
    this.setState({ loading: true });
    const { date } = this.state;
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();
    const Api = new PakkasmarjaApi();
    const freshDeliveries = await Api.getDeliveriesService(this.props.accessToken.access_token).listDeliveries(undefined, "DELIVERY", "FRESH", undefined, undefined, undefined, endOfDay, startOfDay, undefined, 999);
    const frozenDeliveries = await Api.getDeliveriesService(this.props.accessToken.access_token).listDeliveries(undefined, "DELIVERY", "FROZEN", undefined, undefined, this.state.selectedDeliveryPlaceId, endOfDay, startOfDay, undefined, 999);
    const freshContactIds = freshDeliveries.map(delivery => delivery.userId);
    const frozenContactIds = frozenDeliveries.map(delivery => delivery.userId);
    const contactUniqIds = _.uniq(freshContactIds.concat(frozenContactIds));
    const contactService = await Api.getContactsService(this.props.accessToken.access_token);
    const contactPromises = contactUniqIds.map(id => contactService.findContact(id));
    const contacts = await Promise.all(contactPromises);
    this.setState({ freshDeliveries, frozenDeliveries, contacts, loading: false });
  }

  /**
   * Render date picker
   */
  private renderDatePicker = () => {
    return (
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <View style={{ alignItems: "center" }}><Text style={{ fontSize: 18, paddingBottom: 10 }}>Valitse päivä</Text></View>
        <TouchableOpacity style={[styles.pickerWrap, { width: "90%" }]} onPress={() => this.setState({ datepickerVisible: true })}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ paddingLeft: 10 }}>
              {
                this.printTime(this.state.date)
              }
            </Text>
          </View>
        </TouchableOpacity>
        <DateTimePicker
          mode="date"
          isVisible={this.state.datepickerVisible}
          onConfirm={(date) => this.setState({ date: date, datepickerVisible: false })}
          onCancel={() => { this.setState({ datepickerVisible: false }); }}
        />
      </View>
    );
  }

  /**
   * Render delivery place dropdown
   */
  private renderDeliveryPlace = () => {
    return (
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <View style={{ alignItems: "center" }}><Text style={{ fontSize: 18, marginVertical: 10 }}>Valitse toimituspaikka</Text></View>
        <View style={[styles.pickerWrap, { width: "90%" }]}>
          {
            Platform.OS !== "ios" &&
            <Picker
              selectedValue={this.state.selectedDeliveryPlaceId}
              style={{ height: 50, width: "900%" }}
              onValueChange={(itemValue) =>
                this.setState({ selectedDeliveryPlaceId: itemValue })
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
              selectedKey={this.state.selectedDeliveryPlaceId}
              initValue="Valitse toimituspaikka"
              onChange={(option: any) => { this.setState({ selectedDeliveryPlaceId: option.key }) }} />
          }
        </View>
      </View>
    );
  }

  /**
   * Renders list of deliveries
   * 
   * @param category category
   */
  private renderDeliveryList = (category: ItemGroupCategory) => {
    if (!this.state.frozenDeliveries || !this.state.freshDeliveries || !this.state.contacts || !this.state.products) {
      return;
    }

    const listStyle = StyleSheet.create({
      center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start"
      }
    });

    const deliveries = category === "FRESH" ? this.state.freshDeliveries : this.state.frozenDeliveries;
    const deliveryListItems: DeliveryListItem[] = deliveries.map((delivery) => {
      return {
        delivery: delivery,
        product: this.state.products!.find(product => product.id === delivery.productId),
        contact: this.state.contacts!.find(contact => contact.id === delivery.userId)
      }
    });
    const sortedItems = _.sortBy(deliveryListItems, listItem => listItem.contact ? listItem.contact.displayName : "");
    return (
      <View style={{ flex: 1, flexDirection: "column", paddingTop: 15, paddingHorizontal: 10 }}>
        {this.renderDatePicker()}
        {
          category === "FROZEN" &&
          this.renderDeliveryPlace()}
        <View style={{ flexDirection: "row", height: 50, borderColor: "gray", borderBottomWidth: 1, marginTop: 10 }}>
          <View style={listStyle.center}><Text>Viljelijä</Text></View>
          <View style={listStyle.center}><Text>Tuote</Text></View>
          <View style={{ flex: 0.5, justifyContent: "center", alignItems: "center" }}><Text>Määrä</Text></View>
        </View>
        {
          this.state.loading ?
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#E51D2A" />
            </View>
            :
            sortedItems.map((deliveryListItem) => {
              const { delivery, contact, product } = deliveryListItem;
              return (
                <TouchableOpacity key={delivery.id} onPress={() => this.handleListItemPress(category, false, deliveryListItem)}>
                  <View style={{ flex: 1, flexDirection: "row", height: 80, borderColor: "gray", borderBottomWidth: 1 }}>
                    <View style={listStyle.center}><Text>{contact ? contact.displayName : ""}</Text></View>
                    <View style={listStyle.center}><Text>{product ? product.name : ""}</Text></View>
                    <View style={{ flex: 0.5, justifyContent: "center", alignItems: "center" }}><Text>{delivery.amount}</Text></View>
                  </View>
                </TouchableOpacity>
              );
            })
        }
        <TouchableOpacity
          style={[styles.begindeliveryButton, { width: "70%", height: 60, marginTop: 25, alignSelf: "center" }]}
          onPress={() => this.handleListItemPress(category, true, undefined)}>
          <Text style={{ color: '#f2f2f2', fontWeight: "600" }}>Uusi toimitus</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
  * Render delivery contact
  * @param category ItemGroupCategory
  * @param isNewDelivery isNewDelivery 
  * @param deliveryListItem deliveryListItem 
  */
  private handleListItemPress(category: ItemGroupCategory, isNewDelivery: boolean, deliveryListItem?: DeliveryListItem) {
    this.props.navigation.navigate("ManageDelivery", {
      deliveryListItem,
      category,
      isNewDelivery
    });
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

export default connect(mapStateToProps, mapDispatchToProps)(ManageDeliveries);
