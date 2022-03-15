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
          <Icon
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
    if (!this.props.accessToken) {
      return;
    }
    this.setState({ loading: true });
    const Api = new PakkasmarjaApi();
    const deliveryQualitiesService = await Api.getDeliveryQualitiesService(this.props.accessToken.access_token);
    const deliveryQualities = await deliveryQualitiesService.listDeliveryQualities(this.props.itemGroupCategory);
    this.setState({ deliveryQualities });

    const deliveriesAndProducts: DeliveryProduct[] = this.getDeliveries();
    const pastDeliveries: DeliveryProduct[] = deliveriesAndProducts.filter(deliveryData => deliveryData.delivery.status === "DONE" || deliveryData.delivery.status === "NOT_ACCEPTED");
    const sortedPastDeliveries = _.sortBy(pastDeliveries, [(deliveryProduct: DeliveryProduct) => { return deliveryProduct.delivery.time; }]).reverse();
    const deliveryData: Map<string, DeliveryProduct[]> = new Map<string, DeliveryProduct[]>();

    sortedPastDeliveries.forEach((delivery) => {
      const deliveryDate = moment(delivery.delivery.time).format("DD.MM.YYYY");
      const existingDeliveries: DeliveryProduct[] = deliveryData.get(deliveryDate) || [];
      existingDeliveries.push(delivery);
      deliveryData.set(deliveryDate, existingDeliveries);
    });
    this.setState({ deliveryData: deliveryData, loading: false });
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
    }

    return this.props.deliveries.freshDeliveryData;
  }

  /**
   * render quality status
   */
  private renderQualityStatus = (deliveryQualityId: string) => {
    const deliveryQuality = this.state.deliveryQualities.find((deliveryQuality) => deliveryQuality.id == deliveryQualityId);
    if (deliveryQuality) {
      const letter = deliveryQuality.displayName.slice(0, 1).toUpperCase();
      return (
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingLeft: 8 }}>
          <View style={[styles.deliveryQualityRoundView, { backgroundColor: deliveryQuality.color || "gray" }]} >
            <Text style={styles.deliveryQualityRoundViewText}>{letter}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text>{deliveryQuality && deliveryQuality.displayName}</Text>
          </View>
        </View>
      );
    }
  }

  /**
   * render not accepted delivery
   */
  private renderNotAccepted = () => {
    return (
      <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingLeft: 8 }}>
        <View style={[styles.deliveryQualityRoundView, { backgroundColor: "red" }]} >
          <Text style={styles.deliveryQualityRoundViewText}>H</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text>Hylätty</Text>
        </View>
      </View>
    );
  }

  /**
   * Render method
   */
  public render() {
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View >
          <View style={[styles.center, styles.topViewWithButton]}>
            <View style={[styles.center, { flexDirection: "row", paddingVertical: 30 }]}>
              <Thumbnail square small source={COMPLETED_DELIVERIES_LOGO} style={{ marginRight: 10 }} />
              <Text style={styles.viewHeaderText}>Tehdyt toimitukset</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: "column", backgroundColor: "white" }}>
            {
              this.state.loading ?
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#E51D2A" />
                </View>
                :
                Array.from(this.state.deliveryData.keys()).map((date, index : number) => {
                  const deliveries = this.state.deliveryData.get(date);
                  return (
                    <View key={date + index}>
                      <Text style={styles.dateContainerText}>
                        {date}
                      </Text>
                      {
                        deliveries && deliveries.map((data: any) => {
                          return this.renderListItem(data);
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

  /**
   * Renders list items
   *
   * @param deliveryData DeliveryProduct
   */
  private renderListItem = (deliveryData: DeliveryProduct) => {
    if (!deliveryData || !deliveryData.product ) {
      return <Text></Text>;
    }
    const time = moment(deliveryData.delivery.time).format("DD.MM.YYYY HH:mm");
    const productName = deliveryData.product.name;
    const productAmount = `, ${deliveryData.delivery.amount} x ${deliveryData.product.units} ${deliveryData.product.unitName}`;
    const editable = false;

    return (
      <TouchableOpacity key={deliveryData.delivery.id} style={styles.center} onPress={
        () => this.onListItemClick("Delivery",
          deliveryData.delivery.id,
          deliveryData.product && deliveryData.product.id,
          deliveryData.delivery.qualityId,
          editable,
        )
      }>
        <View style={[styles.renderCustomListItem, deliveryData.delivery.status === "NOT_ACCEPTED" && { backgroundColor: "whitesmoke", opacity: 0.6 }]}>
          <View style={{ flex: 2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'black' }}>{time}</Text>
              <Text style={{ color: 'black', fontWeight: 'bold' }}>{`${productName} ${productAmount}`}</Text>
            </View>
          </View>
          {
            deliveryData.delivery.status === "DONE"
              ?
              deliveryData.delivery.qualityId && this.renderQualityStatus(deliveryData.delivery.qualityId)
              :
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
