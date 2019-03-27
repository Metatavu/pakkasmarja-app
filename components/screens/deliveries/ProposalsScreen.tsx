import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { Text, Thumbnail } from "native-base";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { styles } from "./styles.tsx";
import { RED_LOGO } from "../../../static/images";
import PakkasmarjaApi from "../../../api";
import { Delivery, Product } from "pakkasmarja-client";
import Moment from "react-moment";

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
 * Proposal screen component class
 */
class ProposalsScreen extends React.Component<Props, State> {

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

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const deliveriesAndProducts: DeliveryProduct[] = this.getDeliveries();
    const proposalsData: DeliveryProduct[] = deliveriesAndProducts.filter(deliveryData => deliveryData.delivery.status === "PROPOSAL");
    this.setState({ deliveryData: proposalsData });
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
   * Component did update life-cycle event
   */
  public componentDidUpdate(previousProps: Props, previousState: State) {
    if (previousState.productType && !this.state.productType) {
      this.setState({ productType: previousState.productType });
    }
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * Render method
   */
  public render() {
    if (this.state.loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View>
          <View style={[styles.center, styles.topViewWithButton]}>
            <View style={[styles.center, { flexDirection: "row", paddingVertical: 30 }]}>
              <Thumbnail square small source={RED_LOGO} style={{ marginRight: 10 }} />
              <Text style={styles.viewHeaderText}>Ehdotukset</Text>
            </View>
          </View>
          <View>
            {
              this.state.deliveryData.map((deliveryData: DeliveryProduct) => {
                return this.renderListItem(deliveryData)
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
    if (!deliveryData || !deliveryData.product || !deliveryData.delivery.time) {
      return <Text key={deliveryData.delivery.id}></Text>;
    }
    const date = deliveryData.delivery.time;
    const productName = deliveryData.product.name;
    const productAmount = `${deliveryData.product.unitSize} G x ${deliveryData.product.units}`;
    const deliveryId = deliveryData.delivery.id;
    const productId = deliveryData.product.id;
    return (
      <View key={deliveryId} style={styles.renderCustomListItem}>
        <View style={{ flex: 2 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Text>Toimituspäivä </Text><Moment element={Text} format="DD.MM.YYYY">{date.toString()}</Moment>
            </View>
            <Text style={{ color: 'black', fontWeight: 'bold' }}>{`${productName} ${productAmount}`}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.proposalCheckButton, { flex: 0.8, height: 45 }]}
          onPress={() => {
            this.props.navigation.navigate("ProposalCheck", {
              deliveryId: deliveryId,
              productId: productId,
              productType: this.state.productType
            })
          }}
        >
          <Text style={styles.buttonText}>Tarkasta</Text>
        </TouchableOpacity>
      </View>
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

export default connect(mapStateToProps, mapDispatchToProps)(ProposalsScreen);
