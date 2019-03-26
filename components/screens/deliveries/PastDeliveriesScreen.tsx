import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { styles } from "./styles.tsx";
import { Thumbnail, Text } from "native-base";
import { COMPLETED_DELIVERIES_LOGO, COMPLETED_DELIVERIES_LOGO_GRAY } from "../../../static/images";
import PakkasmarjaApi from "../../../api";
import { Delivery, Product } from "pakkasmarja-client";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
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
      deliveryData: []
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }
    this.setState({ loading: true });

    const Api = new PakkasmarjaApi();
    const deliveriesService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    const productsService = await Api.getProductsService(this.props.accessToken.access_token);
    const productType = await this.props.navigation.state.params.type;
    const deliveries: Delivery[] = await deliveriesService.listDeliveries(this.props.accessToken.userId, "DONE", productType);
    const products: Product[] = await productsService.listProducts();

    const deliveriesAndProducts: DeliveryProduct[] = [];
    deliveries.forEach((delivery) => {
      const product = products.find(product => product.id === delivery.productId);
      deliveriesAndProducts.push({
        delivery: delivery,
        product: product
      });
    });

    this.setState({ deliveryData: deliveriesAndProducts, productType, loading: false });
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
        <View >
          <View style={[styles.center, styles.topViewWithButton]}>
            <View style={[styles.center, { flexDirection: "row", paddingVertical: 30 }]}>
              <Thumbnail square small source={COMPLETED_DELIVERIES_LOGO} style={{ marginRight: 10 }} />
              <Text style={styles.viewHeaderText}>Tehdyt toimitukset</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: "column", backgroundColor: "white" }}>
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
    if (!deliveryData || !deliveryData.product) {
      return <Text></Text>;
    }
    const weekNumber = deliveryData.delivery.time;
    const productName = deliveryData.product.name; // Onko se product.name vai product.unitName
    const productAmount = `${deliveryData.product.unitSize} G x ${deliveryData.product.units}`;
    const editable = false;

    return (
      <TouchableOpacity key={deliveryData.delivery.id} style={styles.center} onPress={
        () => this.onListItemClick("Delivery",
          deliveryData.delivery.id,
          deliveryData.product && deliveryData.product.id,
          editable)
      }>
        <View style={styles.renderCustomListItem}>
          <View style={{ flex: 2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'black' }}>{weekNumber}</Text>
              <Text style={{ color: 'black', fontWeight: 'bold' }}>{`${productName} ${productAmount}`}</Text>
            </View>
          </View>
          <View style={[styles.center, { flexDirection: "row" }]}>
            <Thumbnail square source={COMPLETED_DELIVERIES_LOGO_GRAY} style={[styles.itemIconSize, { marginRight: 10 }]} />
            <Text style={{ color: "lightgray" }}>Toimitettu</Text>
          </View>
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
  private onListItemClick = (screen: string, deliveryId?: string, productId?: string, editable?: boolean) => {
    this.props.navigation.navigate(screen, {
      deliveryId: deliveryId,
      productId: productId,
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
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PastDeliveriesScreen);
