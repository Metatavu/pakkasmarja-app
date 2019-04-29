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
import * as _ from "lodash";
import { ItemGroupCategory } from "pakkasmarja-client";

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
  deliveryQualitys: DeliveryQuality[];
};

// TODO remove whend deliveryQuality backend is ready
export interface DeliveryQuality {
  id: string,
  itemGroupCategory: ItemGroupCategory,
  name: string,
  priceBonus: number,
  color: string
}

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
      deliveryQualitys: []
    };
  }

  static navigationOptions = ({ navigation }: any) => {
    return {
      headerTitle: <TopBar
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

    //TODO remove when deliveryQualityId backend is ready
    const deliveryQuality1: DeliveryQuality = { id: "1", name: "bonus", color: "#43AB18", priceBonus: 2, itemGroupCategory: "FRESH" };
    const deliveryQuality2: DeliveryQuality = { id: "2", name: "perus", color: "#FFB512", priceBonus: 1.2, itemGroupCategory: "FRESH" };
    const deliveryQuality3: DeliveryQuality = { id: "3", name: "välttävä", color: "#AA6EE0", priceBonus: 0, itemGroupCategory: "FRESH" };
    const deliveryQuality4: DeliveryQuality = { id: "4", name: "bonus", color: "#43AB18", priceBonus: 2, itemGroupCategory: "FROZEN" };
    const deliveryQuality5: DeliveryQuality = { id: "5", name: "perus", color: "#FFB512", priceBonus: 1.2, itemGroupCategory: "FROZEN" };
    const deliveryQuality6: DeliveryQuality = { id: "6", name: "välttävä", color: "#AA6EE0", priceBonus: 0, itemGroupCategory: "FROZEN" };
    const deliveryQualitys: DeliveryQuality[] = [deliveryQuality1, deliveryQuality2, deliveryQuality3, deliveryQuality4, deliveryQuality5, deliveryQuality6]
    this.setState({ deliveryQualitys }); //

    const deliveriesAndProducts: DeliveryProduct[] = this.getDeliveries();
    const pastDeliveries: DeliveryProduct[] = deliveriesAndProducts.filter(deliveryData => deliveryData.delivery.status === "DONE");
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
    //TODO find delivery quality from array of deliveryQualitys which comes from api
    const deliveryQuality = this.state.deliveryQualitys.find((deliveryQuality) => deliveryQuality.id == deliveryQualityId);
    if (deliveryQuality) {
      const letter = deliveryQuality.name.slice(0, 1).toUpperCase();
      return (
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          <View style={[styles.deliveryQualityRoundView, { backgroundColor: deliveryQuality.color }]} >
            <Text style={styles.deliveryQualityRoundViewText}>{letter}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text>{deliveryQuality && deliveryQuality.name}</Text>
          </View>
        </View>
      );
    }
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
                Array.from(this.state.deliveryData.keys()).map((date: any, index) => { //TODO remove when deliveryQualityId backend is ready
                  const deliveries = this.state.deliveryData.get(date);
                  return (
                    <View key={date}>
                      <Text style={styles.dateContainerText}>
                        {date}
                      </Text>
                      {
                        deliveries && deliveries.map((data: any) => {
                          return this.renderListItem(data, index) //TODO remove when deliveryQualityId backend is ready
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
  private renderListItem = (deliveryData: DeliveryProduct, index: number) => { //TODO remove when deliveryQualityId backend is ready
    if (!deliveryData || !deliveryData.product) {
      return <Text></Text>;
    }
    const i: string = index.toString(); // TODO remove when deliveryQualityId backend is ready
    const deliveryHour = moment(deliveryData.delivery.time).hours();
    const time = deliveryHour > 12 ? `Jälkeen klo 11` : `Ennen kello 11`;
    const productName = deliveryData.product.name;
    const productAmount = `${deliveryData.product.unitSize} G x ${deliveryData.product.units}`;
    const editable = false;

    return (
      <TouchableOpacity key={deliveryData.delivery.id} style={styles.center} onPress={
        () => this.onListItemClick("Delivery",
          deliveryData.delivery.id,
          deliveryData.product && deliveryData.product.id,
          i, // TODO put deliveryQualityId here from deliveryData parameter
          editable,
        )
      }>
        <View style={styles.renderCustomListItem}>
          <View style={{ flex: 2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'black' }}>{time}</Text>
              <Text style={{ color: 'black', fontWeight: 'bold' }}>{`${productName} ${productAmount}`}</Text>
            </View>
          </View>
          {this.renderQualityStatus(i)}
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
