import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { Delivery, Product, ItemGroupCategory } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text } from 'react-native-elements';
import Moment from "react-moment";
import PakkasmarjaApi from "../../../api";
import NumericInput from 'react-native-numeric-input'
import { Thumbnail } from "native-base";
import { PREDICTIONS_ICON } from "../../../static/images";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveries?: DeliveriesState;
  itemGroupCategory?: ItemGroupCategory;
  deliveriesLoaded?: (deliveries: DeliveriesState) => void;
};

/**
 * Component state
 */
interface State {
  loading: boolean;
  modalOpen: boolean;
  delivery?: Delivery;
  product?: Product;
};

/**
 * Proposal check screen component class
 */
class ProposalCheckScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      modalOpen: false,
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
    await this.loadData();
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
    />
  };

  /**
   * Handle proposal accept
   */
  private handleProposalAccept = async () => {
    if (!this.props.accessToken || !this.state.product || !this.state.product.id || !this.state.delivery || !this.state.delivery.id) {
      return;
    }
    const Api = new PakkasmarjaApi();
    const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);

    const delivery: Delivery = {
      id: this.state.delivery.id,
      productId: this.state.product.id,
      userId: this.props.accessToken.userId,
      time: this.state.delivery.time,
      status: "PLANNED",
      amount: this.state.delivery.amount,
      price: this.state.delivery.price,
      quality: this.state.delivery.quality,
      deliveryPlaceId: this.state.delivery.deliveryPlaceId
    }
    const updatedDelivery = await deliveriesService.updateDelivery(delivery, this.state.delivery.id);
    this.updateDeliveries(updatedDelivery);
    this.props.navigation.navigate("Proposals");
  }

  /**
   * Update deliveries
   */
  private updateDeliveries = (delivery: Delivery) => {
    if (!this.props.deliveries) {
      return;
    }

    const deliveries = this.getDeliveries();
    const updatedDeliveries = deliveries.map((deliveryData) => {
      if (deliveryData.delivery.id === delivery.id) {
        return {
          delivery: delivery,
          product: deliveryData.product
        }
      }
      return deliveryData;
    });

    const deliveriesState = this.props.deliveries;

    if (this.props.itemGroupCategory === "FROZEN") {
      deliveriesState.frozenDeliveryData = updatedDeliveries;
    } else {
      deliveriesState.freshDeliveryData = updatedDeliveries;
    }

    this.props.deliveriesLoaded && this.props.deliveriesLoaded(deliveriesState)
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
   * Load data
   */
  private loadData = async () => {
    const deliveryId: string = this.props.navigation.getParam('deliveryId');

    const deliveriesAndProducts: DeliveryProduct[] = this.getDeliveries();
    const selectedDelivery: DeliveryProduct | undefined = deliveriesAndProducts.find(deliveryData => deliveryData.delivery.id === deliveryId);

    if (selectedDelivery) {
      this.setState({
        delivery: selectedDelivery.delivery,
        product: selectedDelivery.product
      });
    }
    this.setState({ loading: false });
  }

  /**
   * Render method
   */
  public render() {
    if (this.state.loading || !this.state.delivery) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={[styles.center, styles.topViewWithButton]}>
          <View style={{ flex: 1, flexDirection: "row", marginVertical: 30 }}>
            <View style={{ flex: 0.9 }}>
              <Text style={styles.textPrediction}>Hei! Ehdotamme, että toimittaisitte meille seuraavan toimituksen.</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, padding: 15 }}>
          <View style={{ flex: 1 }}>
            {
              this.state.product &&
              <Text style={[styles.contentHeader, { color: "black" }]}>
                {`${this.state.product.name} ${this.state.product.unitSize} G x ${this.state.product.units}`}
              </Text>
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.textPrediction}>Tämän hetkinen hinta 4,20 €/kg sis Alv.</Text>
          </View>
          <View style={{ flex: 1, paddingTop: 10 }}>
            <Text style={[styles.textWithSpace, { color: "black" }]}>Ehdotettu määrä (KG)</Text>
          </View>
          <View style={[styles.center, styles.numericInputContainer]}>
            <NumericInput
              value={this.state.delivery.amount}
              initValue={this.state.delivery.amount}
              onChange={(value: number) => { }}
              totalWidth={365}
              totalHeight={50}
              iconSize={35}
              step={0}
              valueType='real'
              minValue={0}
              textColor='black'
              iconStyle={{ color: 'white' }}
              rightButtonBackgroundColor='#e01e36'
              leftButtonBackgroundColor='#e01e36'
              borderColor='transparent'
              rounded
            />
          </View>
          <View style={{ flex: 1, flexDirection: "row" }}>
            <View style={styles.center}>
              <Text style={[styles.textPrediction, { marginVertical: 10 }]}>Toimituspäivä</Text>
              <View style={{ flexDirection: "row" }}>
                <Thumbnail square source={PREDICTIONS_ICON} style={{ width: 20, height: 22, marginRight: 10 }} />
                <Moment style={{ fontWeight: "bold", fontSize: 16, color: "black" }} element={Text} format="DD.MM.YYYY">
                  {this.state.delivery.time && this.state.delivery.time.toString()}
                </Moment>
              </View>
            </View>
          </View>
          <View style={[styles.center, { flex: 1 }]}>
            <View style={{ flex: 1, flexDirection: "row", marginTop: 15 }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                <TouchableOpacity style={[styles.declineButton, { width: "95%", height: 60 }]} onPress={() => this.props.navigation.goBack()} >
                  <Text style={styles.buttonText}>Peruuta</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end" }}>
                <TouchableOpacity style={[styles.deliveriesButton, { width: "95%", height: 60 }]} onPress={() => { this.handleProposalAccept() }} >
                  <Text style={styles.buttonText}>Hyväksy</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    itemGroupCategory: state.itemGroupCategory,
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
    deliveriesLoaded: (deliveries: DeliveriesState) => dispatch(actions.deliveriesLoaded(deliveries))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ProposalCheckScreen);
