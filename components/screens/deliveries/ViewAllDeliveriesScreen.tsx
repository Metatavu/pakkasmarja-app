import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight } from "react-native";
import { styles } from "./styles.tsx";
import { Text, Icon } from "native-base";
import PakkasmarjaApi from "../../../api";
import { Delivery, Product, ItemGroup } from "pakkasmarja-client";
import moment from "moment";
import FeatherIcon from "react-native-vector-icons/Feather";
import * as _ from "lodash";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveries?: DeliveriesState;
};

/**
 * Component state
 */
interface State {
  loading: boolean;
  deliveryData: Map<string, DeliveryProduct[]>;
  filteredDates: Date[];
  filteredData: DeliveryProduct[];
  itemGroups: ItemGroup[];
  itemGroupIndex: number;
  weekNumberArrayIndex: number;
  weekNumber: number;
  selectedItemGroup?: ItemGroup;
  allDeliveryProducts: DeliveryProduct[];
  weekNumberArray: number[];
};

/**
 * View all deliveries screen component class
 */
class ViewAllDeliveriesScreen extends React.Component<Props, State> {

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
      filteredData: [],
      filteredDates: [],
      itemGroups: [],
      itemGroupIndex: 0,
      weekNumberArrayIndex: 0,
      weekNumber: moment().week(),
      allDeliveryProducts: [],
      weekNumberArray: []
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
          <FeatherIcon
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
    await this.loadItemGroups();
    this.refreshDeliveryData();
  }

  /**
   * Component did update life-cycle event
   */
  public async componentDidUpdate(prevProps: Props, prevState: State) {
    if (!this.props.accessToken) {
      return;
    }
    if (this.state.selectedItemGroup !== prevState.selectedItemGroup && this.state.selectedItemGroup) {
      const itemGroupId = this.state.selectedItemGroup.id;
      const filteredDeliveryProductsById: DeliveryProduct[] = this.state.allDeliveryProducts.filter((deliveryProduct: DeliveryProduct) => {
        return deliveryProduct.product && deliveryProduct.product.itemGroupId == itemGroupId;
      })
      const filteredDeliveryProductsByYear: DeliveryProduct[] = filteredDeliveryProductsById.filter((deliveryProduct: DeliveryProduct) => {
        return moment(deliveryProduct.delivery.time).year() == moment().year();
      });

      let weekNumberArray: number[] = filteredDeliveryProductsByYear.map((deliveryProduct: DeliveryProduct) => {
        return moment(deliveryProduct.delivery.time).week();
      })
      weekNumberArray = _.sortBy(_.uniq(weekNumberArray));
      this.setState({ weekNumberArray, weekNumber: weekNumberArray[0], weekNumberArrayIndex: 0 });
    }
  }

  /**
   * Load item groups 
   */
  private loadItemGroups = async () => {
    if (!this.props.accessToken || !this.props.deliveries) {
      return;
    }

    const api = new PakkasmarjaApi();
    const freshDeliveryData: DeliveryProduct[] = this.props.deliveries.freshDeliveryData;
    const frozenDeliveryData: DeliveryProduct[] = this.props.deliveries.frozenDeliveryData;
    let allDeliveryProducts: DeliveryProduct[] | string[] = freshDeliveryData.concat(frozenDeliveryData);
    this.setState({ allDeliveryProducts });

    allDeliveryProducts = _.uniqWith(allDeliveryProducts, (arrVal: any, othVal: any) => {
      if (arrVal.product && othVal.product) {
        return arrVal.product.itemGroupId === othVal.product.itemGroupId && arrVal;
      }
    });

    const itemGroupIds = allDeliveryProducts.map((deliveryProduct: DeliveryProduct) => {
      return deliveryProduct.product && deliveryProduct.product.itemGroupId;
    });

    const itemGroupService = api.getItemGroupsService(this.props.accessToken.access_token);
    const itemGroups = await itemGroupService.listItemGroups();
    const filteredItemGroups = itemGroups.filter((itemgroup) => {
      return itemGroupIds.includes(itemgroup.id);
    })
    this.setState({ itemGroups: filteredItemGroups, selectedItemGroup: filteredItemGroups[0] });
  }

  /**
   * Changes item group
   * 
   * @param action action
   */
  private changeItemGroup = async (action: string) => {
    const maxValue: number = this.state.itemGroups.length - 1;
    const minValue: number = 0;
    let itemGroupIndex = this.state.itemGroupIndex;

    if (action === "next") {
      if (this.state.itemGroupIndex !== maxValue) {
        itemGroupIndex = this.state.itemGroupIndex + 1;
      } else {
        itemGroupIndex = minValue;
      }
    }

    if (action === "previous") {
      if (this.state.itemGroupIndex !== minValue) {
        itemGroupIndex = this.state.itemGroupIndex - 1;
      } else {
        itemGroupIndex = maxValue;
      }
    }

    await this.setState({ itemGroupIndex });
    await this.setState({ selectedItemGroup: this.state.itemGroups[this.state.itemGroupIndex] });
    await this.refreshDeliveryData();
    this.setState({ weekNumber: this.state.weekNumberArray[0] });
  }

  /**
   * Changes week
   * 
   * @param action action
   */
  private changeWeekNumber = async (action: string) => {
    const maxValue: number = this.state.weekNumberArray.length - 1;
    const minValue: number = 0;
    let weekNumberArrayIndex = this.state.weekNumberArrayIndex;

    if (action === "next") {
      if (this.state.weekNumberArrayIndex !== maxValue) {
        weekNumberArrayIndex = this.state.weekNumberArrayIndex + 1;
      } else {
        weekNumberArrayIndex = minValue;
      }
    }

    if (action === "previous") {
      if (this.state.weekNumberArrayIndex !== minValue) {
        weekNumberArrayIndex = this.state.weekNumberArrayIndex - 1;
      } else {
        weekNumberArrayIndex = maxValue;
      }
    }

    await this.setState({ weekNumberArrayIndex });
    await this.setState({ weekNumber: this.state.weekNumberArray[weekNumberArrayIndex] });
    this.refreshDeliveryData();
  }

  /**
   * Refresh delivery data
   */
  private refreshDeliveryData = async () => {
    if (!this.props.accessToken || !this.state.selectedItemGroup) {
      return;
    }
    this.setState({ loading: true });

    const itemGroupId = this.state.selectedItemGroup.id;
    const week = this.state.weekNumber;
    const timeAfter = moment().day("Monday").week(week).toDate();
    const timeBefore = moment(timeAfter).add(1, "week").toDate();

    const Api = new PakkasmarjaApi();
    const deliveriesService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const productsService = await Api.getProductsService(this.props.accessToken.access_token);

    let deliveries: Delivery[] = await deliveriesService.listDeliveries(this.props.accessToken.userId, undefined, undefined, itemGroupId, undefined, undefined, timeBefore, timeAfter, 0, 100);
    deliveries = _.sortBy(deliveries, 'time').reverse();
    const products: Product[] = await productsService.listProducts();

    const deliveryData: Map<string, DeliveryProduct[]> = new Map<string, DeliveryProduct[]>();

    deliveries.forEach((delivery) => {
      const deliveryDate = moment(delivery.time).format("DD.MM.YYYY");
      const product = products.find(product => product.id === delivery.productId);
      const deliveryProduct: DeliveryProduct = {
        delivery: delivery,
        product: product
      };

      const existingDeliveries: DeliveryProduct[] = deliveryData.get(deliveryDate) || [];
      existingDeliveries.push(deliveryProduct);
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
        <View>
          <View style={{ flex: 1, flexDirection: "row", padding: 15 }}>
            <View style={styles.center}>
              <TouchableOpacity onPress={() => { this.changeItemGroup("previous") }} >
                <Icon style={styles.red} type="Entypo" name="chevron-left"></Icon>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 8, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontWeight: "bold", fontSize: 24, color: "black" }}>
                {this.state.selectedItemGroup ? this.state.selectedItemGroup.displayName : "-"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { this.changeItemGroup("next") }} >
              <Icon style={styles.red} type="Entypo" name="chevron-right"></Icon>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, flexDirection: "row", padding: 15 }}>
            <View style={styles.center}>
              <TouchableOpacity onPress={() => { this.changeWeekNumber("previous") }} >
                <Icon style={styles.red} type="Entypo" name="chevron-left"></Icon>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 8, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontWeight: "bold", fontSize: 24, color: "black" }}>
                {`Viikko ${this.state.weekNumber}`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { this.changeWeekNumber("next") }} >
              <Icon style={styles.red} type="Entypo" name="chevron-right"></Icon>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, flexDirection: "column", backgroundColor: "white" }}>
            {
              this.state.loading ?
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#E51D2A" />
                </View>
                :
                Array.from(this.state.deliveryData.keys()).map((date: any) => {
                  const deliveries = this.state.deliveryData.get(date);
                  return (
                    <View key={date} style={{ paddingLeft: 20, paddingTop: 10, paddingBottom: 10, borderBottomColor: "rgba(0,0,0,0.5)", borderBottomWidth: 1 }}>
                      <Text style={{ fontWeight: "bold" }}>
                        {date}
                      </Text>
                      {
                        deliveries && deliveries.map((data: any) => {
                          return (
                            <Text key={data.delivery.id}>
                              {`${data.product.name} ${data.product.unitSize} ${data.product.unitName} x ${data.delivery.amount}`}
                            </Text>
                          );
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
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewAllDeliveriesScreen);
