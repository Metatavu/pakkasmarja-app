import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { Tabs, Tab } from "native-base";
import { TouchableOpacity, Image, View, Text, TouchableHighlight, Dimensions } from "react-native";
import { styles } from './styles.tsx'
import PakkasmarjaApi from "../../../api";
import { PREDICTIONS_ICON, RED_LOGO, INCOMING_DELIVERIES_LOGO, COMPLETED_DELIVERIES_LOGO } from "../../../static/images";
import { Delivery, Product, ItemGroupCategory } from "pakkasmarja-client";
import { NavigationEvents } from "react-navigation";
import Icon from "react-native-vector-icons/Feather";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveriesLoaded?: (deliveries: DeliveriesState) => void;
  itemGroupCategoryUpdate?: (itemGroupCategory: ItemGroupCategory) => void;
  deliveries?: DeliveriesState;
  itemGroupCategory?: "FRESH" | "FROZEN";
};

/**
 * Component state
 */
interface State {
  loading: boolean;
  deliveries: Delivery[];
  freshProposalAmount: number;
  freshPlannedAmount: number;
  frozenProposalAmount: number;
  frozenPlannedAmount: number;
  deliveriesState?: DeliveriesState
};

/**
 * Deliveries screen component class
 */
class DeliveriesScreen extends React.Component<Props, State> {

  private refreshInterval: any;

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      deliveries: [],
      freshProposalAmount: 0,
      freshPlannedAmount: 0,
      frozenProposalAmount: 0,
      frozenPlannedAmount: 0
    };
  }

  static navigationOptions = ({ navigation }: any) => {
    return {
      headerTitle: <TopBar navigation={navigation}
        showMenu={true}
        showHeader={false}
        showUser={true}
      />,
      headerTitleStyle: { width: Dimensions.get('window').width },
      headerTitleContainerStyle: {
        left: 0,
      },
      headerLeft:
        <TouchableHighlight onPress={() => { navigation.goBack(null) }} >
          <Icon
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
    if (!this.props.itemGroupCategoryUpdate) {
      return;
    }
    await this.loadDeliveriesData();
    await this.props.itemGroupCategoryUpdate("FRESH");
    this.loadAmounts();

    this.refreshInterval = setInterval(this.refreshDeliveries, 1000 * 30);
  }

  /**
   * Component will unmount life-cycle event
   */
  public componentWillUnmount = () => {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  /**
   * Refresh deliveries
   */
  private refreshDeliveries = () => {
    this.loadDeliveriesData();
    this.loadAmounts();
  }

  /**
   * Load deliverys
   */
  private loadDeliveriesData = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveriesService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const productsService = await Api.getProductsService(this.props.accessToken.access_token);

    const freshDeliveries: Delivery[] = await deliveriesService.listDeliveries(this.props.accessToken.userId, undefined, "FRESH", undefined, undefined, undefined, undefined, undefined, 0, 200);
    const frozenDeliveries: Delivery[] = await deliveriesService.listDeliveries(this.props.accessToken.userId, undefined, "FROZEN", undefined, undefined, undefined, undefined, undefined, 0, 200);

    // TODO: Fix this properly
    const products: Product[] = await productsService.listProducts(undefined, undefined, undefined, 0, 999);

    const freshDeliveriesAndProducts: DeliveryProduct[] = freshDeliveries.map((delivery) => {
      return {
        delivery: delivery,
        product: products.find(product => product.id === delivery.productId)
      };
    });

    const frozenDeliveriesAndProducts: DeliveryProduct[] = frozenDeliveries.map((delivery) => {
      return {
        delivery: delivery,
        product: products.find(product => product.id === delivery.productId)
      };
    });

    const deliveriesState: DeliveriesState = {
      freshDeliveryData: freshDeliveriesAndProducts,
      frozenDeliveryData: frozenDeliveriesAndProducts
    };

    this.props.deliveriesLoaded && this.props.deliveriesLoaded(deliveriesState);
  }

  /**
   * load amounts
   */
  private loadAmounts = () => {
    if (!this.props.deliveries || !this.props.itemGroupCategory) {
      return;
    }

    const deliveries: DeliveriesState = this.props.deliveries;
    let freshProposalAmount = 0;
    let freshPlannedAmount = 0;
    let frozenProposalAmount = 0;
    let frozenPlannedAmount = 0;

    deliveries.freshDeliveryData.forEach((deliveryProduct: DeliveryProduct) => {
      if (deliveryProduct.delivery.status == "PROPOSAL") {
        freshProposalAmount++;
      } else if (deliveryProduct.delivery.status == "PLANNED") {
        freshPlannedAmount++;
      }

      this.setState({ freshProposalAmount, freshPlannedAmount });
    });

    deliveries.frozenDeliveryData.forEach((deliveryProduct: DeliveryProduct) => {
      if (deliveryProduct.delivery.status == "PROPOSAL") {
        frozenProposalAmount++;
      } else if (deliveryProduct.delivery.status == "PLANNED") {
        frozenPlannedAmount++;
      }

      this.setState({ frozenProposalAmount, frozenPlannedAmount });
    });
  }

  /**
   * Update item group category
   */
  private updateItemGroupCategory = (itemGroupCategory: ItemGroupCategory) => {
    if (!this.props.accessToken) {
      return;
    }
    this.props.itemGroupCategoryUpdate && this.props.itemGroupCategoryUpdate(itemGroupCategory);
  }

  /**
   * On delivery item click
   * 
   * @param screen screen
   * @param type type
   */
  private onDeliveryItemClick = (screen: string, itemGroupCategory: ItemGroupCategory) => {
    this.updateItemGroupCategory(itemGroupCategory);
    this.props.navigation.navigate(screen);
  }

  /**
   * Render list item
   */
  private renderDeliveryList = (deliveryList: {}[], itemGroupCategory: ItemGroupCategory) => {
    return (
      <View style={{ flex: 1, flexDirection: "column", marginTop: 40 }}>
        {
          deliveryList.map((listItem: any) => {
            const plannedAmount: number = itemGroupCategory == "FRESH" ? listItem.freshPlannedAmount : listItem.frozenPlannedAmount;
            const proposalAmount: number = itemGroupCategory == "FRESH" ? listItem.freshProposalAmount : listItem.frozenProposalAmount;
            return (
              <TouchableOpacity key={listItem.screen} onPress={() => { this.onDeliveryItemClick(listItem.screen, itemGroupCategory) }}>
                <View key={listItem.screen} style={{ width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 35 }}>
                  <View style={{ width: 40, alignContent: "center", alignItems: "center", paddingLeft: 5, paddingRight: 5 }}>
                    <Image
                      style={{ flex: 1, width: 40, resizeMode: 'contain' }}
                      source={listItem.icon}
                    />
                  </View>
                  <View style={{ width: 300, paddingLeft: 20, flex: 1, justifyContent: 'center' }}>
                    <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
                      {listItem.name}
                    </Text>
                  </View>
                  {
                    listItem.screen == "Proposals" && proposalAmount > 0 ?
                      <View style={{ justifyContent: "center" }}>
                        <View style={styles.roundColoredView} >
                          <Text style={styles.roundViewText}>{proposalAmount}</Text>
                        </View>
                      </View>
                      :
                      null
                  }
                  {
                    listItem.screen == "IncomingDeliveries" && plannedAmount > 0 ?
                      <View style={{ justifyContent: "center" }}>
                        <View style={styles.roundColoredView} >
                          <Text style={styles.roundViewText}>{plannedAmount}</Text>
                        </View>
                      </View>
                      :
                      null
                  }
                </View>
              </TouchableOpacity>
            );
          })
        }
      </View>
    );
  }

  /**
   * Render method
   */
  public render() {
    const deliveryList = [{
      freshProposalAmount: this.state.freshProposalAmount,
      frozenProposalAmount: this.state.frozenProposalAmount,
      name: "Ehdotukset",
      screen: "Proposals",
      icon: RED_LOGO
    }, {
      name: "Viikkoennusteet",
      screen: "WeekDeliveryPrediction",
      icon: PREDICTIONS_ICON
    }, {
      frozenPlannedAmount: this.state.frozenPlannedAmount,
      freshPlannedAmount: this.state.freshPlannedAmount,
      name: "Tulevat toimitukset",
      screen: "IncomingDeliveries",
      icon: INCOMING_DELIVERIES_LOGO
    }, {
      name: "Tehdyt toimitukset",
      screen: "PastDeliveries",
      icon: COMPLETED_DELIVERIES_LOGO
    }];

    const canManageDeliveries = this.props.accessToken ? this.props.accessToken.realmRoles.indexOf("update-other-deliveries") > -1 : false;

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <NavigationEvents onDidFocus={() => this.loadAmounts()} />
        <Tabs tabBarUnderlineStyle={{ backgroundColor: "#fff" }}>
          <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} activeTextStyle={styles.activeText} textStyle={{ color: "#fff" }} tabStyle={styles.tab} heading={"TUORE"}>
            {
              this.renderDeliveryList(deliveryList, "FRESH")
            }
            {
              canManageDeliveries &&
              <TouchableOpacity onPress={() => { this.onDeliveryItemClick("ManageDeliveries", "FRESH") }}>
                <View style={{ width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 80 }}>
                  <View style={{ width: 300, paddingLeft: 20, flex: 1, justifyContent: 'center' }}>
                    <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
                      Toimitusten vastaanotto
                  </Text>
                  </View>
                </View>
              </TouchableOpacity>
            }
          </Tab>
          <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} activeTextStyle={styles.activeText} textStyle={{ color: "#fff" }} tabStyle={styles.tab} heading={"PAKASTE"}>
            {
              this.renderDeliveryList(deliveryList, "FROZEN")
            }
            {
              canManageDeliveries &&
              <TouchableOpacity onPress={() => { this.onDeliveryItemClick("ManageDeliveries", "FROZEN") }}>
                <View style={{ width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 80 }}>
                  <View style={{ width: 300, paddingLeft: 20, flex: 1, justifyContent: 'center' }}>
                    <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
                      Toimitusten vastaanotto
                  </Text>
                  </View>
                </View>
              </TouchableOpacity>
            }
          </Tab>
        </Tabs>
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
    deliveries: state.deliveries,
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
    itemGroupCategoryUpdate: (itemGroupCategory: ItemGroupCategory) => dispatch(actions.itemGroupCategoryUpdate(itemGroupCategory)),
    deliveriesLoaded: (deliveries: DeliveriesState) => dispatch(actions.deliveriesLoaded(deliveries))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DeliveriesScreen);
