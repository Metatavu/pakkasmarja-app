import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, TouchableOpacity, ActivityIndicator, TouchableHighlight, Platform } from "react-native";
import { styles } from "./styles.tsx";
import { Thumbnail, Text } from "native-base";
import { INCOMING_DELIVERIES_LOGO, INDELIVERY_LOGO, RED_LOGO } from "../../../static/images";
import moment from "moment";
import Icon from "react-native-vector-icons/Feather";
import _ from "lodash";
import { StackNavigationOptions } from '@react-navigation/stack';

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

  private navigationFocusEventSubscription: any;

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

  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerStyle: {
        height: 100,
        backgroundColor: "#E51D2A"
      },
      headerTitle: () => (
        <TopBar
          navigation={ navigation }
          showMenu
          showHeader={ false }
          showUser
        />
      ),
      headerTitleContainerStyle: {
        left: 0
      },
      headerLeft: () => (
        <TouchableHighlight onPress={ navigation.goBack }>
          <Icon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
      )
    }
  };

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const { accessToken, navigation } = this.props;

    navigation.setOptions(this.navigationOptions(navigation));

    if (!accessToken) {
      return;
    }

    this.setState({ loading: true });

    this.navigationFocusEventSubscription = navigation.addListener('focus', this.loadData);
  }

  /**
   * Component will unmount life-cycle event
   */
  componentWillUnmount = () => {
    this.props.navigation.removeListener(this.navigationFocusEventSubscription);
  }

  /**
   * Renders list items
   *
   * @param deliveryData delivery data
   */
  private renderListItems = (deliveryData: DeliveryProduct) => {
    const { product, delivery } = deliveryData;

    if (!product) {
      return;
    }

    const productText = `${product.name} ${delivery.amount} x ${product.units} ${product.unitName}`;

    return (
      <View
        key={ delivery.id }
        style={ styles.renderCustomListItem }
      >
        <View style={{ flex: 1.8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "black", fontSize: 15 }}>
              {`klo ${moment(delivery.time).format("HH.mm")}`}
            </Text>
            <Text style={{ color: 'black', fontWeight: 'bold' }}>
              { productText }
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          { this.renderStatus(deliveryData) }
        </View>
      </View>
    );
  }

  /**
   * Renders elements depending on delivery status
   */
  private renderStatus = (deliveryData: DeliveryProduct) => {
    const { navigation } = this.props;
    const { status } = deliveryData.delivery;

    if (status === "PROPOSAL") {
      return (
        <View style={[ styles.center, { flexDirection: "row" } ]}>
          { Platform.OS === "android" &&
            <Thumbnail
              square
              small
              source={ RED_LOGO }
              style={{ marginRight: 10 }}
            /> 
          }
          <Text style={{ color: "black" }}>
            Ehdotuksissa
          </Text>
        </View>
      );
    }

    if (status === "DELIVERY") {
      return (
        <View style={[ styles.center, { flexDirection: "row" } ]}>
          <Thumbnail
            square
            source={ INDELIVERY_LOGO }
            style={{ width: 36, height: 21, marginRight: 10 }}
          />
          <Text style={ styles.green }>
            Toimituksessa
          </Text>
        </View>
      );
    }

    if (status === "PLANNED") {
      return (
        <View style={ styles.center }>
          <TouchableOpacity
            style={[ styles.begindeliveryButton, styles.center, { width: "100%", height: 40 } ]}
            onPress={() =>
              navigation.navigate("Delivery", {
                deliveryId: deliveryData.delivery.id,
                productId: deliveryData.product?.id || "",
                editable: true
              })
            }
          >
            <Text style={ styles.buttonText }>
              Tarkasta toimitus
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  }

  /**
   * Get deliveries
   *
   * @return deliveries
   */
  private getDeliveries = () => {
    const { deliveries, itemGroupCategory } = this.props;

    if (!deliveries) {
      return [];
    }

    if (itemGroupCategory === "FROZEN") {
      return deliveries.frozenDeliveryData;
    } else {
      return deliveries.freshDeliveryData;
    }
  }

  /**
   * Loads data
   */
  private loadData = () => {
    const incomingDeliveriesData = this.getDeliveries().filter(({ delivery: { status } }) =>
      ![ "DONE", "REJECTED", "NOT_ACCEPTED" ].includes(status)
    );

    const sortedByTimeIncomingDeliveriesData = _.sortBy(incomingDeliveriesData, [ deliveryProduct => deliveryProduct.delivery.time ]);

    const deliveryData = new Map<string, DeliveryProduct[]>();

    sortedByTimeIncomingDeliveriesData.forEach(delivery => {
      const deliveryDate = moment(delivery.delivery.time).format("DD.MM.YYYY");
      deliveryData.set(deliveryDate, [ ...(deliveryData.get(deliveryDate) || []), delivery ]);
    });

    const sortedDates = new Map(Array.from(deliveryData).reverse());

    this.setState({
      deliveryData: sortedDates,
      loading: false
    });
  }

  /**
   * Render method
   */
  public render = () => {
    const { navigation } = this.props;
    const { loading, deliveryData } = this.state;

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
        <View >
          <View style={[ styles.center, styles.topViewWithButton ]}>
            <View style={[ styles.center, { flexDirection: "row", marginTop: 30 } ]}>
              <Thumbnail
                square source={ INCOMING_DELIVERIES_LOGO }
                style={{ width: 60, height: 35, marginRight: 10 }}
              />
              <Text style={ styles.viewHeaderText }>
                Tulevat toimitukset
              </Text>
            </View>
            <TouchableOpacity
              style={[ styles.deliveriesButton, { width: "60%", height: 50, marginVertical: 30 } ]}
              onPress={ () => navigation.navigate("NewDelivery") }
            >
              <Text style={ styles.buttonText }>
                Uusi toimitus
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: "column" }}>
            {
              loading ?
                <View style={ styles.loaderContainer }>
                  <ActivityIndicator size="large" color="#E51D2A" />
                </View>
                :
                Array.from(deliveryData.keys()).map(date => (
                  <View key={ date }>
                    <Text style={ styles.dateContainerText }>
                      { date }
                    </Text>
                    { deliveryData.get(date)?.map(this.renderListItems) }
                  </View>
                ))
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
