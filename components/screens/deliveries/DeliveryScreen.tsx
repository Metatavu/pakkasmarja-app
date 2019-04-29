import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight } from "react-native";
import { Delivery, Product, DeliveryNote, ItemGroupCategory } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text } from 'react-native-elements';
import Moment from "react-moment";
import moment from "moment";
import PakkasmarjaApi from "../../../api";
import { NavigationEvents } from 'react-navigation';
import FeatherIcon from "react-native-vector-icons/Feather";
import Icon from "react-native-vector-icons/EvilIcons";
import CreateDeliveryNoteModal from "./CreateDeliveryNoteModal";
import ViewOrDeleteNoteModal from "./ViewOrDeleteNoteModal";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveries?: DeliveriesState;
  itemGroupCategory?: "FRESH" | "FROZEN";
  deliveriesLoaded?: (deliveries: DeliveriesState) => void;
};

/**
 * Component state
 */
interface State {
  loading: boolean;
  editable: boolean;
  deliveryData?: DeliveryProduct;
  deliveryNotes?: DeliveryNote[];
  createModal: boolean;
  editModal: boolean;
  deliveryNoteId?: string;
  deliveryQuality?: DeliveryQuality;
};

//TODO remove when DeliveryQuality backend ready
export interface DeliveryQuality {
  id: string,
  itemGroupCategory: ItemGroupCategory,
  name: string,
  priceBonus: number,
  color: string
}

/**
 * Delivery component class
 */
class DeliveryScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      editable: false,
      createModal: false,
      editModal: false
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
    this.setState({ loading: true });
    await this.loadData();
    await this.loadDeliveryNotes();
    this.setState({ loading: false });
  }

  /**
   * Handles begin delivery
   */
  private handleBeginDelivery = async () => {
    if (!this.props.accessToken || !this.state.deliveryData || !this.state.deliveryData.product || !this.state.deliveryData.delivery.id || !this.state.deliveryData.product.id) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const deliveryState = this.state.deliveryData.delivery;

    const delivery: Delivery = {
      id: deliveryState.id,
      productId: this.state.deliveryData.product.id,
      userId: this.props.accessToken.userId,
      time: deliveryState.time,
      status: "DELIVERY",
      amount: deliveryState.amount,
      price: deliveryState.price,
      deliveryPlaceId: deliveryState.deliveryPlaceId
    }

    const updatedDelivery = await deliveryService.updateDelivery(delivery, this.state.deliveryData.delivery.id);
    this.updateDeliveries(updatedDelivery);
    this.props.navigation.navigate("IncomingDeliveries");
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
    }

    return this.props.deliveries.freshDeliveryData;
  }

  /**
   * Load data
   */
  private loadData = async () => {
    if (!this.props.accessToken) {
      return;
    }
    const deliveryId: string = this.props.navigation.getParam('deliveryId');
    const productId: string = this.props.navigation.getParam('productId');
    const qualityId: string = this.props.navigation.getParam('qualityId');

    //TODO remove when deliveryQualityId backend is ready
    const deliveryQuality1: DeliveryQuality = { id: "1", name: "bonus", color: "#43AB18", priceBonus: 2, itemGroupCategory: "FRESH" };
    const deliveryQuality2: DeliveryQuality = { id: "2", name: "perus", color: "#FFB512", priceBonus: 1.2, itemGroupCategory: "FRESH" };
    const deliveryQuality3: DeliveryQuality = { id: "3", name: "välttävä", color: "#AA6EE0", priceBonus: 0, itemGroupCategory: "FRESH" };
    const deliveryQuality4: DeliveryQuality = { id: "4", name: "bonus", color: "#43AB18", priceBonus: 2, itemGroupCategory: "FROZEN" };
    const deliveryQuality5: DeliveryQuality = { id: "5", name: "perus", color: "#FFB512", priceBonus: 1.2, itemGroupCategory: "FROZEN" };
    const deliveryQuality6: DeliveryQuality = { id: "6", name: "välttävä", color: "#AA6EE0", priceBonus: 0, itemGroupCategory: "FROZEN" };
    const deliveryQualitys: DeliveryQuality[] = [deliveryQuality1, deliveryQuality2, deliveryQuality3, deliveryQuality4, deliveryQuality5, deliveryQuality6]
    const deliveryQuality = deliveryQualitys.find((deliveryQuality) => deliveryQuality.id == qualityId);
    this.setState({ deliveryQuality }); //

    const Api = new PakkasmarjaApi();
    const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const productsService = Api.getProductsService(this.props.accessToken.access_token);
    const delivery: Delivery = await deliveriesService.findDelivery(deliveryId);
    const product: Product = await productsService.findProduct(productId);
    const editable: boolean = this.props.navigation.getParam('editable');
    const deliveryData = { delivery, product }
    this.setState({ editable: editable, deliveryData: deliveryData });
  }

  /**
   * Load delivery notes
   */
  private loadDeliveryNotes = async () => {
    if (!this.props.accessToken || !this.state.deliveryData) {
      return;
    }
    const Api = new PakkasmarjaApi();
    const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const deliveryNotes: DeliveryNote[] = await deliveriesService.listDeliveryNotes(this.state.deliveryData.delivery.id || "");
    this.setState({ deliveryNotes });
  }

  /**
   * Render method
   */
  public render() {
    if (this.state.loading || !this.state.deliveryData || !this.state.deliveryData.product || !this.state.deliveryData.delivery.time) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <NavigationEvents onWillFocus={() => this.loadData()} />
        <View style={{ flex: 1, padding: 25 }}>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 16 }}>Tuote</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16 }}>{`${this.state.deliveryData.product.name} ${this.state.deliveryData.product.unitSize} G x ${this.state.deliveryData.product.units}`}</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 16 }}>Määrä (Yksikköä)</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16 }}>{this.state.deliveryData.delivery.amount}</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 16 }}>Toimituspäivä</Text>
            </View>
            <View style={{ flex: 0.5 }}>
              <Moment element={Text} format="DD.MM.YYYY">{this.state.deliveryData.delivery.time.toString()}</Moment>
            </View>
            <View style={{ flex: 0.5 }}>
              <Text>{moment(this.state.deliveryData.delivery.time).hours() > 12 ? `Jälkeen klo 11` : `Ennen kello 11`}</Text>
            </View>
          </View>
          {this.state.deliveryQuality &&
            <View style={{ flex: 1, flexDirection: 'row', alignItems: "center", paddingVertical: 5, height: 60 }}>
              <View style={{ flex: 0.8 }}>
                <Text style={{ fontSize: 16 }}>Laatuluokka</Text>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.deliveryQualityRoundView, { backgroundColor: this.state.deliveryQuality.color }]} >
                  <Text style={[styles.deliveryQualityRoundViewText]}>{this.state.deliveryQuality.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View >
                  <Text style={{ color: "black", fontSize: 14, fontWeight: "400", marginBottom: 4 }}>{this.state.deliveryQuality.name}</Text>
                </View>
              </View>
            </View>
          }
          {
            this.state.editable ?
              <React.Fragment>
                {
                  this.state.deliveryNotes ?
                    this.state.deliveryNotes.map((deliveryNote: DeliveryNote, index) => {
                      return (
                        <View key={index} style={[styles.center, { flex: 1, paddingVertical: 10 }]}>
                          <TouchableOpacity onPress={() => this.setState({ deliveryNoteId: deliveryNote.id, editModal: true })}>
                            <View style={[styles.center, { flex: 1, flexDirection: "row" }]}>
                              <Icon size={25} style={{ color: "#e01e36" }} name="pencil" />
                              <Text style={{ fontSize: 16, color: "#e01e36" }} >
                                {`Katso/poista huomio`}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                    : null
                }
                <View style={[styles.center, { flex: 1, paddingVertical: 10 }]}>
                  <TouchableOpacity onPress={() => this.setState({ createModal: true })}>
                    <View style={[styles.center, { flex: 1, flexDirection: "row" }]}>
                      <Icon size={25} style={{ color: "#e01e36" }} name="pencil" />
                      <Text style={{ fontSize: 16, color: "#e01e36" }} >
                        {`Lisää huomio`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={[styles.center, { flex: 1, paddingVertical: 25 }]}>
                  <TouchableOpacity onPress={() => {
                    this.props.navigation.navigate("EditDelivery", {
                      deliveryData: this.state.deliveryData
                    })
                  }}>
                    <View style={[styles.center, { flexDirection: "row" }]}>
                      <Text style={[styles.red, { fontWeight: "bold", fontSize: 18, textDecorationLine: "underline" }]} >Muokkaa</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={[styles.center, { flex: 1 }]}>
                  <TouchableOpacity
                    style={[styles.begindeliveryButton, styles.center, { width: "70%", height: 60 }]}
                    onPress={() => { this.handleBeginDelivery() }}>
                    <Text style={{ color: '#f2f2f2', fontWeight: "600" }}>Aloita toimitus</Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
              :
              <View style={{ marginTop: 30 }}>
                <Text style={{ color: "black", fontSize: 18, fontWeight: "400" }}>Pakkasmarjan kommentti:</Text>
                {/*TODO pakkasmarja delivery note text and photo */}
              </View>
          }
        </View>
        <CreateDeliveryNoteModal
          loadDeliveryNotes={this.loadDeliveryNotes}
          deliveryId={this.state.deliveryData.delivery.id || ""}
          modalClose={() => this.setState({ createModal: false })}
          modalOpen={this.state.createModal}
        />
        <ViewOrDeleteNoteModal
          loadDeliveryNotes={this.loadDeliveryNotes}
          deliveryId={this.state.deliveryData.delivery.id || ""}
          deliveryNoteId={this.state.deliveryNoteId || ""}
          modalClose={() => this.setState({ editModal: false })}
          modalOpen={this.state.editModal}
        />
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
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken)),
    deliveriesLoaded: (deliveries: DeliveriesState) => dispatch(actions.deliveriesLoaded(deliveries))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DeliveryScreen);
