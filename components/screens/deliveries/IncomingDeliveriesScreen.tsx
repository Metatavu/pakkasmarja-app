import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, TouchableOpacity, ActivityIndicator, TouchableHighlight } from "react-native";
import { styles } from "./styles.tsx";
import { Text } from 'react-native';
import { Thumbnail } from "native-base";
import { INCOMING_DELIVERIES_LOGO, INDELIVERY_LOGO, RED_LOGO } from "../../../static/images";
import { NavigationEvents } from "react-navigation";
import moment from "moment";
import Icon from "react-native-vector-icons/Feather";
import * as _ from "lodash";

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
  deliveryData: Map<string, DeliveryProduct[]>
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
      deliveryData: new Map<string, DeliveryProduct[]>()
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
    if (!this.props.accessToken) {
      return;
    }
    this.setState({ loading: true });
  }

  /**
   * Renders list items
   */
  private renderListItems = (delivery: DeliveryProduct) => {
    if (!delivery.product) {
      return;
    }

    const time = moment(delivery.delivery.time).format("DD.MM.YYYY");
    const productText = `${delivery.product.name} ${delivery.delivery.amount} x ${delivery.product.units} ${delivery.product.unitName}`;

    return (
      <View key={delivery.delivery.id} style={styles.renderCustomListItem}>
        <View style={{ flex: 1.8 }}>
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
          <Text >Ehdotuksissa</Text>
        </View>
      );
    } else if (status === "DELIVERY") {
      return (
        <View style={[styles.center, { flexDirection: "row" }]}>
          <Thumbnail square source={INDELIVERY_LOGO} style={{ width: 36, height: 21, marginRight: 10 }} />
          <Text style={styles.green}>Toimituksessa</Text>
        </View>
      );
    } else if (status === "PLANNED") {
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
  private loadData = () => {
    const deliveriesAndProducts: DeliveryProduct[] = this.getDeliveries();
    const incomingDeliveriesData: DeliveryProduct[] = deliveriesAndProducts.filter(deliveryData => deliveryData.delivery.status !== "DONE" && deliveryData.delivery.status !== "REJECTED");
    const sortedByTimeIncomingDeliveriesData = _.sortBy(incomingDeliveriesData, [(deliveryProduct) => { return deliveryProduct.delivery.time; }]).reverse();
    const deliveryData: Map<string, DeliveryProduct[]> = new Map<string, DeliveryProduct[]>();

    sortedByTimeIncomingDeliveriesData.forEach((delivery) => {
      const deliveryDate: string = moment(delivery.delivery.time).format("DD.MM.YYYY");
      const existingDeliveries: DeliveryProduct[] = deliveryData.get(deliveryDate) || [];
      existingDeliveries.push(delivery);
      deliveryData.set(deliveryDate, existingDeliveries);
    });

    this.setState({ deliveryData: deliveryData, loading: false });
  }

  /**
   * Render method
   */
  public render() {
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <NavigationEvents onDidFocus={this.loadData} />
        <View >
          <View style={[styles.center, styles.topViewWithButton]}>
            <View style={[styles.center, { flexDirection: "row", marginTop: 30 }]}>
              <Thumbnail square source={INCOMING_DELIVERIES_LOGO} style={{ width: 60, height: 35, marginRight: 10 }} />
              <Text style={styles.viewHeaderText}>Tulevat toimitukset</Text>
            </View>
            <TouchableOpacity style={[styles.deliveriesButton, { width: "60%", height: 50, marginVertical: 30 }]} onPress={() => { this.props.navigation.navigate("NewDelivery") }}>
              <Text style={styles.buttonText}>Uusi toimitus</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: "column" }}>
            {
              this.state.loading ?
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#E51D2A" />
                </View>
                :
                Array.from(this.state.deliveryData.keys()).map((date: string) => {
                  const deliveries = this.state.deliveryData.get(date);
                  return (
                    <View key={date} >
                      <Text style={styles.dateContainerText}>
                        {date}
                      </Text>
                      {
                        deliveries && deliveries.map((data: DeliveryProduct) => {
                          return this.renderListItems(data)
                        })
                      }
                    </View>
                  );
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
