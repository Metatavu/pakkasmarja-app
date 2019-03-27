import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { styles } from "./styles.tsx";
import { Text } from 'react-native';
import { Thumbnail } from "native-base";
import { INCOMING_DELIVERIES_LOGO, INDELIVERY_LOGO, RED_LOGO } from "../../../static/images";
import { NavigationEvents } from "react-navigation";
import moment from "moment";
import ContractDeliveryPlace from "../contracts/ContractDeliveryPlace";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveries?: DeliveriesState;
  itemGroupCategory?: "FRESH" | "FROZEN";
};

/**
 * Component state
 */
interface State {
  loading: boolean;
  deliveryData: DeliveryProduct[];
  productType?: "FRESH" | "FROZEN";
};

/**
 * Incoming deliveries component class
 */
class IncomingDeliveriesScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      deliveryData: []
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
   * Renders list items
   */
  private renderListItems = (delivery: DeliveryProduct) => {
    if (!delivery.product) {
      return;
    }

    const time = moment(delivery.delivery.time).format("DD.MM.YYYY");
    const productText = `${delivery.product.name} ${delivery.product.unitSize} ${delivery.product.unitName} x ${delivery.product.units}`;

    return (
      <View key={delivery.delivery.id} style={styles.renderCustomListItem}>
        <View style={{ flex: 2 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'black' }}>
              {time}
            </Text>
            <Text style={{ color: 'black', fontWeight: 'bold' }}>
              {productText}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          {this.renderStatus(delivery)}
        </View>
      </View>
    );
  }

  /**
   * Renders elements depending on delivery status
   */
  private renderStatus = (deliveryData: DeliveryProduct) => {
    const status = deliveryData.delivery.status;
    if (status === "PROPOSAL") {
      return (
        <View style={[styles.center, { flexDirection: "row" }]}>
          <Thumbnail square small source={RED_LOGO} style={{ marginRight: 10 }} />
          <Text >Tarkistuksessa</Text>
        </View>
      );
    }
    else if (status === "DELIVERY") {
      return (
        <View style={[styles.center, { flexDirection: "row" }]}>
          <Thumbnail square source={INDELIVERY_LOGO} style={{ width: 36, height: 21, marginRight: 10 }} />
          <Text style={styles.green}>Toimituksessa</Text>
        </View>
      );
    }
    else if (status === "PLANNED") {
      return (
        <View style={styles.center}>
          <TouchableOpacity
            style={[styles.begindeliveryButton, styles.center, { width: "100%", height: 40 }]}
            onPress={() => {
              this.props.navigation.navigate("Delivery", {
                deliveryId: deliveryData.delivery.id,
                productId: deliveryData.product ? deliveryData.product.id : "",
                editable: true
              })
            }}
          >
            <Text style={styles.buttonText}>Aloita toimitus</Text>
          </TouchableOpacity>
        </View>
      );
    }
    else if (status === "DONE") {
      return (
        <View style={[styles.center, { flexDirection: "row" }]}>
          <Thumbnail square small source={RED_LOGO} style={{ marginRight: 10 }} />
          <Text style={styles.red}>Hyväksytty</Text>
        </View>
      );
    }
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
    } else {
      return this.props.deliveries.freshDeliveryData;
    }
  }

  /**
   * Loads data
   */
  private loadData = async () => {
    const deliveriesAndProducts: DeliveryProduct[] = this.getDeliveries();
    const incomingDeliveriesData: DeliveryProduct[] = deliveriesAndProducts.filter(deliveryData => deliveryData.delivery.status !== "DONE" && deliveryData.delivery.status !== "REJECTED");
    this.setState({ deliveryData: incomingDeliveriesData });
  }

  /**
   * Render method
   */
  public render() {
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <NavigationEvents onDidFocus={() => this.loadData()} />
        <View >
          <View style={[styles.center, styles.topViewWithButton]}>
            <View style={[styles.center, { flexDirection: "row", marginTop: 30 }]}>
              <Thumbnail square source={INCOMING_DELIVERIES_LOGO} style={{ width: 60, height: 35, marginRight: 10 }} />
              <Text style={styles.viewHeaderText}>Tulevat toimitukset</Text>
            </View>
            <TouchableOpacity style={[styles.deliveriesButton, { width: "60%", height: 50, marginVertical: 30 }]} onPress={() => { this.props.navigation.navigate("NewDelivery", { type: this.state.productType }) }}>
              <Text style={styles.buttonText}>Uusi toimitus</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: "column", backgroundColor: "white" }}>
            {this.state.loading ?
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#E51D2A" />
              </View>
              :
              this.state.deliveryData.map((delivery) => {
                return this.renderListItems(delivery)
              })
            }
          </View>
        </View>
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
    products: state.products,
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

export default connect(mapStateToProps, mapDispatchToProps)(IncomingDeliveriesScreen);
