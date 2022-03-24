import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight } from "react-native";
import { styles } from "./styles.tsx";
import { Thumbnail, Text } from "native-base";
import { COMPLETED_DELIVERIES_LOGO } from "../../../static/images";
import moment from "moment";
import Icon from "react-native-vector-icons/Feather";
import _ from "lodash";
import { DeliveryQuality } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
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
  deliveryData: Map<string, DeliveryProduct[]>;
  deliveryQualities: DeliveryQuality[];
};


/**
 * Past deliveries component class
 */
class PastDeliveriesScreen extends React.Component<Props, State> {

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      deliveryData: new Map<string, DeliveryProduct[]>(),
      deliveryQualities: []
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
            size={ 40 }
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
    const { navigation, accessToken } = this.props;

    navigation.setOptions(this.navigationOptions(navigation));

    if (!accessToken) {
      return;
    }

    this.setState({ loading: true });

    const deliveryQualities = await new PakkasmarjaApi()
      .getDeliveryQualitiesService(accessToken.access_token)
      .listDeliveryQualities(this.props.itemGroupCategory);

    const pastDeliveries = this.getDeliveries().filter(({ delivery: { status } }) => [ "DONE", "NOT_ACCEPTED" ].includes(status));
    const sortedPastDeliveries = _.sortBy(pastDeliveries, [
      deliveryProduct => deliveryProduct.delivery.time
    ]).reverse();

    const deliveryData = new Map<string, DeliveryProduct[]>();

    sortedPastDeliveries.forEach(delivery => {
      const deliveryDate = moment(delivery.delivery.time).format("DD.MM.YYYY");
      deliveryData.set(deliveryDate, [ ...(deliveryData.get(deliveryDate) || []), delivery ]);
    });

    this.setState({
      deliveryData: deliveryData,
      deliveryQualities: deliveryQualities,
      loading: false
    });
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
    }

    return deliveries.freshDeliveryData;
  }

  /**
   * render quality status
   *
   * @param deliveryQualityId delivery quality ID
   */
  private renderQualityStatus = (deliveryQualityId: string) => {
    const { deliveryQualities } = this.state;

    const deliveryQuality = deliveryQualities.find(deliveryQuality => deliveryQuality.id == deliveryQualityId);

    if (deliveryQuality) {
      const letter = deliveryQuality.displayName.slice(0, 1).toUpperCase();

      return (
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingLeft: 8 }}>
          <View style={[ styles.deliveryQualityRoundView, { backgroundColor: deliveryQuality.color || "gray" }] }>
            <Text style={ styles.deliveryQualityRoundViewText }>
              { letter }
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text>
              { deliveryQuality?.displayName }
            </Text>
          </View>
        </View>
      );
    }
  }

  /**
   * render not accepted delivery
   */
  private renderNotAccepted = () => (
    <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingLeft: 8 }}>
      <View style={[ styles.deliveryQualityRoundView, { backgroundColor: "red" } ]}>
        <Text style={ styles.deliveryQualityRoundViewText }>
          H
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text>
          Hylätty
        </Text>
      </View>
    </View>
  );

  /**
   * Render method
   */
  public render() {
    const { navigation } = this.props;
    const { loading, deliveryData } = this.state;

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
        <View>
          <View style={[ styles.center, styles.topViewWithButton ]}>
            <View style={[ styles.center, { flexDirection: "row", paddingVertical: 30 } ]}>
              <Thumbnail
                square
                small
                source={ COMPLETED_DELIVERIES_LOGO }
                style={{ marginRight: 10 }}
              />
              <Text style={ styles.viewHeaderText }>
                Tehdyt toimitukset
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: "column", backgroundColor: "white" }}>
            {
              loading ?
                <View style={ styles.loaderContainer }>
                  <ActivityIndicator size="large" color="#E51D2A" />
                </View>
                :
                Array.from(deliveryData.keys()).map((date, index) => (
                  <View key={ date + index }>
                    <Text style={ styles.dateContainerText }>
                      { date }
                    </Text>
                    { deliveryData.get(date)?.map(this.renderListItem) }
                  </View>
                ))
            }
          </View>
        </View>
      </BasicScrollLayout>
    );
  }

  /**
   * Renders list items
   *
   * @param deliveryData DeliveryProduct
   */
  private renderListItem = (deliveryData: DeliveryProduct) => {
    const { navigation } = this.props;
    const { delivery, product } = deliveryData;

    if (!product) {
      return <Text></Text>;
    }

    const time = moment(delivery.time).format("DD.MM.YYYY HH:mm");
    const productName = product.name;
    const productAmount = `, ${deliveryData.delivery.amount} x ${product.units} ${product.unitName}`;
    const editable = false;

    return (
      <TouchableOpacity
        key={ deliveryData.delivery.id }
        style={ styles.center }
        onPress={ () =>
          navigation.navigate("Delivery", {
            deliveryId: delivery.id,
            productId: product.id,
            qualityId: delivery.qualityId,
            editable: editable
          })
        }
      >
        <View
          style={[
            styles.renderCustomListItem,
            delivery.status === "NOT_ACCEPTED" && { backgroundColor: "whitesmoke", opacity: 0.6 }
          ]}
        >
          <View style={{ flex: 2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'black' }}>
                { time }
              </Text>
              <Text style={{ color: 'black', fontWeight: 'bold' }}>
                { `${productName} ${productAmount}` }
              </Text>
            </View>
          </View>
          {
            deliveryData.delivery.status === "DONE" ?
              deliveryData.delivery.qualityId && this.renderQualityStatus(deliveryData.delivery.qualityId) :
              this.renderNotAccepted()
          }
        </View>
      </TouchableOpacity>
    );
  }

  /**
   * On list item click
   *
   * @param screen screen
   * @param deliveryId deliveryId
   * @param productId productId
   * @param editable boolean
   */
  private onListItemClick = (screen: string, deliveryId?: string, productId?: string, qualityId?: string, editable?: boolean) => {
    this.props.navigation.navigate(screen, {
      deliveryId: deliveryId,
      productId: productId,
      qualityId: qualityId,
      editable: editable
    });
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

export default connect(mapStateToProps, mapDispatchToProps)(PastDeliveriesScreen);
