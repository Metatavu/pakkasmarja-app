import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { Tabs, Tab, Thumbnail } from "native-base";
import { TouchableOpacity, Image, View, Text } from "react-native";
import { List, ListItem } from 'react-native-elements';
import { styles } from './styles.tsx'
import PakkasmarjaApi from "../../../api";
import { PREDICTIONS_ICON, RED_LOGO, INCOMING_DELIVERIES_LOGO, COMPLETED_DELIVERIES_LOGO } from "../../../static/images";
import { Delivery, Product } from "pakkasmarja-client";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveriesLoaded?: (deliveries: Delivery[]) => void;
  productsLoaded?: (products: Product[]) => void;
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
    await this.loadDeliveries();
    await this.loadProducts();
  }

  /**
   * Load deliverys
   */
  private loadDeliveries = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveriesService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const deliveries: Delivery[] = await deliveriesService.listDeliveries(this.props.accessToken.userId, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 0, 200);
    this.props.deliveriesLoaded && this.props.deliveriesLoaded(deliveries);
  }

  /**
   * Load products
   */
  private loadProducts = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const productsService = await Api.getProductsService(this.props.accessToken.access_token);
    const products: Product[] = await productsService.listProducts();
    this.props.productsLoaded && this.props.productsLoaded(products);
  }

  /**
   * On delivery item click
   * 
   * @param screen screen
   * @param type type
   */
  private onDeliveryItemClick = (screen: string, type: string) => {
    this.props.navigation.navigate(screen, {
      type: type
    });
  }

  /**
   * Render list item
   */
  renderDeliveryList = (deliveryList: any, productType: string) => {
    return (
      <View style={{ flex: 1, flexDirection: "column", marginTop: 50 }}>
        {
          deliveryList.map((listItem: any) => {
            return (
              <TouchableOpacity key={listItem.screen} onPress={() => { this.onDeliveryItemClick(listItem.screen, productType) }}>
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
    accessToken: state.accessToken,
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
    deliveriesLoaded: (deliveries: Delivery[]) => dispatch(actions.deliveriesLoaded(deliveries)),
    productsLoaded: (products: Product[]) => dispatch(actions.productsLoaded(products))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DeliveriesScreen);
