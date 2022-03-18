import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryListItem } from "../../../types";
import * as actions from "../../../actions";
import { View, TouchableHighlight, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import FeatherIcon from "react-native-vector-icons/Feather";
import _ from "lodash";
import PakkasmarjaApi from "../../../api";
import { Tabs, Tab } from "native-base";
import { styles } from "../deliveries/styles.tsx";
import { ItemGroupCategory, Delivery, Contact, Product, DeliveryPlace, DeliveryStatus } from "pakkasmarja-client";
import moment from "moment";
import DateTimePicker from "react-native-modal-datetime-picker";
import { Text } from "native-base";
import ModalSelector from 'react-native-modal-selector';
import strings from "../../../localization/strings";
import { Picker } from "native-base";
import { StackNavigationOptions } from '@react-navigation/stack';

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  itemGroupCategory?: ItemGroupCategory;
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
  selectedDeliveryStatus: string;
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
      selectedDeliveryPlaceId: "",
      selectedDeliveryStatus: "DELIVERY",
    };
  }

  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
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
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    this.props.navigation.setOptions(this.navigationOptions(this.props.navigation));
    const { accessToken, itemGroupCategory } = this.props;

    if (!accessToken) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const productsService = Api.getProductsService(accessToken.access_token);
    const deliveryPlacesService = Api.getDeliveryPlacesService(accessToken.access_token);
    const products = await productsService.listProducts(undefined, undefined, undefined, undefined, 999);
    let deliveryPlaces = await deliveryPlacesService.listDeliveryPlaces();
    const receiveFromPlaceCode = accessToken.receiveFromPlaceCode;

    if (receiveFromPlaceCode) {
      deliveryPlaces = deliveryPlaces.filter(deliveryPlace => deliveryPlace.id === receiveFromPlaceCode);
      if (deliveryPlaces.length === 1) {
        this.setState({ selectedDeliveryPlaceId: receiveFromPlaceCode });
      }
    }

    this.setState({ products, deliveryPlaces, category: itemGroupCategory || "FRESH" }, () => this.loadData());
  }

  /**
   * Component did mount life-cycle event
   *
   * @param prevProps previous component properties
   * @param prevState previous component state
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
    const { accessToken, navigation } = this.props;
    const { category } = this.state;

    const canManageFreshDeliveries = accessToken?.realmRoles.some(role => role === "receive_fresh_berries");
    const canManageFrozenDeliveries = accessToken?.realmRoles.some(role => role === "receive_frozen_berries");

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
        <Tabs
          page={ category === "FRESH" ? 0 : 1 }
          tabBarUnderlineStyle={{ backgroundColor: "#fff" }}
          onChangeTab={ ({ i }: any) => this.setState({ category: i === 0 ? "FRESH" : "FROZEN" }) }
        >
          { canManageFreshDeliveries &&
            <Tab
              activeTabStyle={{ ...styles.activeTab, ...styles.tab }}
              activeTextStyle={ styles.activeText }
              textStyle={{ color: "#fff" }}
              tabStyle={ styles.tab }
              heading="TUORE"
            >
              { this.renderDeliveryList("FRESH") }
            </Tab>
          }
          { canManageFrozenDeliveries &&
            <Tab
              activeTabStyle={{ ...styles.activeTab, ...styles.tab }}
              activeTextStyle={ styles.activeText }
              textStyle={{ color: "#fff" }}
              tabStyle={ styles.tab }
              heading="PAKASTE"
            >
              { this.renderDeliveryList("FROZEN") }
            </Tab>
          }
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
    const [freshDeliveries, frozenDeliveries] = await Promise.all([
      await Api.getDeliveriesService(this.props.accessToken.access_token).listDeliveries(undefined, undefined, "FRESH", undefined, undefined, undefined, endOfDay, startOfDay, undefined, 999),
      await Api.getDeliveriesService(this.props.accessToken.access_token).listDeliveries(undefined, undefined, "FROZEN", undefined, undefined, this.state.selectedDeliveryPlaceId, endOfDay, startOfDay, undefined, 999)
    ]);
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
    const { date, datepickerVisible } = this.state;
    return (
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <View style={{ alignItems: "center" }}><Text style={{ fontSize: 18, paddingBottom: 10 }}>Valitse päivä</Text></View>
        <TouchableOpacity style={[styles.pickerWrap, { width: "90%" }]} onPress={() => this.setState({ datepickerVisible: true })}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ paddingLeft: 10 }}>
              { this.printTime(this.state.date) }
            </Text>
          </View>
        </TouchableOpacity>
        <DateTimePicker
          date={ date }
          mode="date"
          isVisible={ datepickerVisible }
          onConfirm={ date => this.setState({ date: date, datepickerVisible: false }) }
          onCancel={() => this.setState({ datepickerVisible: false }) }
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
              style={{ height: 50, width: "900%", color: "black" }}
              onValueChange={(itemValue: string) =>
                this.setState({ selectedDeliveryPlaceId: itemValue })
              }
            >
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
    const filteredDeliveries = deliveries.filter(delivery => delivery.status === "DELIVERY" || delivery.status === "PLANNED" || delivery.status === "DONE");
    const deliveryListItems: DeliveryListItem[] = filteredDeliveries.map((delivery) => {
      return {
        delivery: delivery,
        product: this.state.products!.find(product => product.id === delivery.productId),
        contact: this.state.contacts!.find(contact => contact.id === delivery.userId)
      }
    });
    const sortedItems = _.sortBy(deliveryListItems, listItem => listItem.contact ? listItem.contact.displayName : "");

    const sortedItemsSelected = sortedItems.filter((item) => item.delivery.status === this.state.selectedDeliveryStatus);

    return (
      <View style={{ flex: 1, flexDirection: "column", paddingTop: 15, paddingHorizontal: 10 }}>
        {this.renderDatePicker()}
        <View style={{ flexDirection: "row", height: 50, marginTop: 10 }}>
          <TouchableOpacity style={this.state.selectedDeliveryStatus === "DELIVERY" ? styles.buttonGroupSelected : styles.buttonGroup} onPress={()=>{this.handleSelectedStatusChange("DELIVERY")}}>
            <Text style={{ color:"#fff", padding:15 }}>{strings.DeliveryStatusDelivery}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={this.state.selectedDeliveryStatus === "PLANNED" ? styles.buttonGroupSelected : styles.buttonGroup} onPress={()=>{this.handleSelectedStatusChange("PLANNED")}}>
            <Text style={{ color:"#fff", padding:15 }}>{strings.DeliveryStatusPlanned}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={this.state.selectedDeliveryStatus === "DONE" ? styles.buttonGroupSelected : styles.buttonGroup} onPress={()=>{this.handleSelectedStatusChange("DONE")}}>
            <Text style={{ color:"#fff", padding:15 }}>{strings.DeliveryStatusDone}</Text>
          </TouchableOpacity>
        </View>
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
            this.renderDeliveryListItems(sortedItemsSelected, category)
        }
        <TouchableOpacity
          style={[styles.begindeliveryButton, { width: "70%", height: 60, marginTop: 25, alignSelf: "center" }]}
          onPress={ () => this.handleListItemPress(category, true, "ManageDelivery", undefined) }
        >
          <Text style={{ color: '#f2f2f2', fontWeight: "600" }}>Uusi toimitus</Text>
        </TouchableOpacity>
        {
          category === "FROZEN" &&
            <TouchableOpacity
              style={[styles.begindeliveryButton, { width: "70%", height: 60, marginTop: 25, alignSelf: "center" }]}
              onPress={ () => this.handleListItemPress(category, true, "ManageBoxDelivery", undefined) }
            >
              <Text style={{ color: '#f2f2f2', fontWeight: "600" }}>{ strings.newDeliveryLoan }</Text>
            </TouchableOpacity>
        }
      </View>
    );
  }

  /**
   * Handles changing selected status
   *
   * @param status status string
   */
  private handleSelectedStatusChange = (status: string) => {
    this.setState({ selectedDeliveryStatus: status });
  }

  /**
   * Render delivery list items
   *
   * @param deliveryListItems deliveryListItems list
   * @param category Item group category
   *
   * @return DeliveryListItems mapped to React components
   */
  private renderDeliveryListItems = (deliveryListItems: DeliveryListItem[], category: ItemGroupCategory) => {
    const listStyle = StyleSheet.create({
      center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start"
      }
    });

    return deliveryListItems.map((deliveryListItem) => {
      const { delivery, contact, product } = deliveryListItem;
      const listItemColor = this.getDeliveryListItemColor(deliveryListItem.delivery.status);

      return (
        <TouchableOpacity key={ delivery.id } onPress={ () => this.handleListItemPress(category, false, "ManageDelivery", deliveryListItem) }>
          <View style={{ flex: 1, flexDirection: "row", height: 80, backgroundColor: listItemColor, borderColor: "gray", borderBottomWidth: 1 }}>
            <View style={ listStyle.center }><Text>{ contact ? contact.displayName : "" }</Text></View>
            <View style={ listStyle.center }><Text>{ product ? product.name : "" }</Text></View>
            <View style={{ flex: 0.5, justifyContent: "center", alignItems: "center" }}><Text>{ delivery.amount }</Text></View>
          </View>
        </TouchableOpacity>
      );
    });
  }

  /**
   * Render delivery contact
   * @param category ItemGroupCategory
   * @param isNewDelivery isNewDelivery
   * @param deliveryListItem deliveryListItem
   */
  private handleListItemPress(category: ItemGroupCategory, isNewDelivery: boolean, delivery: string, deliveryListItem?: DeliveryListItem) {
    const { date } = this.state;

    this.props.navigation.navigate(delivery, {
      date,
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

  private getDeliveryListItemColor = (status: DeliveryStatus) => {
    switch (status) {
      case "DELIVERY": {
        return "#FFF9C4"
      }
      case "DONE": {
        return "#DCEDC8"
      }
      case "PLANNED": {
        return "#B3E5FC"
      }
    }
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
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageDeliveries);
