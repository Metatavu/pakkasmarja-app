import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { Tabs, Tab, Thumbnail } from "native-base";
import { TouchableOpacity, Image, View, Text } from "react-native";
import { List, ListItem } from 'react-native-elements';
import { styles } from './styles.tsx'
import PakkasmarjaApi from "../../../api";
import { PREDICTIONS_ICON, RED_LOGO, INCOMING_DELIVERIES_LOGO, COMPLETED_DELIVERIES_LOGO } from "../../../static/images";
import { Delivery, Product, ItemGroupCategory } from "pakkasmarja-client";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveriesLoaded?: (deliveries: DeliveriesState) => void;
  productsLoaded?: (products: Product[]) => void;
  itemGroupCategoryUpdate?: (itemGroupCategory: ItemGroupCategory) => void;
  deliveries?: Delivery[];
};

/**
 * Component state
 */
interface State {
  loading: boolean;
  productType: "FRESH" | "FROZEN";
  deliveries: Delivery[];
};

/**
 * Deliveries screen component class
 */
class DeliveriesScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      productType: "FRESH",
      deliveries: []
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
    await this.loadDeliveriesData();
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
    
    const products: Product[] = await productsService.listProducts();

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

    console.log(deliveriesState);
    
    this.props.deliveriesLoaded && this.props.deliveriesLoaded(deliveriesState);
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
    this.props.navigation.navigate(screen, {
      type: itemGroupCategory
    });
  }

  /**
   * Render list item
   */
  renderDeliveryList = (deliveryList: any, itemGroupCategory: ItemGroupCategory) => {
    return (
      <View style={{ flex: 1, flexDirection: "column", marginTop: 50 }}>
        {
          deliveryList.map((listItem: any) => {
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
      name: "Ehdotukset",
      icon: RED_LOGO,
      screen: "Proposals"
    }, {
      name: "Viikkoennusteet",
      icon: PREDICTIONS_ICON,
      screen: "WeekDeliveryPrediction"
    }, {
      name: "Tulevat toimitukset",
      icon: INCOMING_DELIVERIES_LOGO,
      screen: "IncomingDeliveries"
    }, {
      name: "Tehdyt toimitukset",
      icon: COMPLETED_DELIVERIES_LOGO,
      screen: "PastDeliveries"
    }];

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <Tabs>
          <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} tabStyle={styles.tab} heading={"TUORETUOTTEET"}>
            {
              this.renderDeliveryList(deliveryList, "FRESH")
            }
          </Tab>
          <Tab activeTabStyle={{ ...styles.activeTab, ...styles.tab }} tabStyle={styles.tab} heading={"PAKASTEET"}>
            {
              this.renderDeliveryList(deliveryList, "FROZEN")
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
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken)),
    itemGroupCategoryUpdate: (itemGroupCategory: ItemGroupCategory) => dispatch(actions.itemGroupCategoryUpdate(itemGroupCategory)),
    deliveriesLoaded: (deliveries: DeliveriesState) => dispatch(actions.deliveriesLoaded(deliveries)),
    productsLoaded: (products: Product[]) => dispatch(actions.productsLoaded(products))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DeliveriesScreen);
