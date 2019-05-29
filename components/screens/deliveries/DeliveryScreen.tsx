import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight, Image, Dimensions, } from "react-native";
import { Delivery, Product, DeliveryNote, DeliveryQuality } from "pakkasmarja-client";
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
import { FileService } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import Lightbox from 'react-native-lightbox';

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
  notes64?: { text: string | undefined, url64?: string }[];
  notesLoading: boolean;
  lightBoxOpen: boolean;
};

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
      editModal: false,
      notesLoading: false,
      lightBoxOpen: false
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
    this.setState({ loading: true });
    await this.loadData();
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
    const Api = new PakkasmarjaApi();
    const deliveryId: string = this.props.navigation.getParam('deliveryId');
    const productId: string = this.props.navigation.getParam('productId');
    const qualityId: string = this.props.navigation.getParam('qualityId');
    const deliveryQualitiesService = await Api.getDeliveryQualitiesService(this.props.accessToken.access_token);
    const deliveryQualities = await deliveryQualitiesService.listDeliveryQualities(this.props.itemGroupCategory);
    const deliveryQuality = deliveryQualities.find((deliveryQuality) => deliveryQuality.id == qualityId);
    this.setState({ deliveryQuality });


    const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const productsService = Api.getProductsService(this.props.accessToken.access_token);
    const delivery: Delivery = await deliveriesService.findDelivery(deliveryId);
    const product: Product = await productsService.findProduct(productId);
    const editable: boolean = this.props.navigation.getParam('editable');
    const deliveryData = { delivery, product }
    this.setState({ editable: editable, deliveryData: deliveryData });
    this.loadDeliveryNotes();
  }

  /**
   * Load delivery notes
   */
  private loadDeliveryNotes = async () => {
    if (!this.props.accessToken || !this.state.deliveryData || !this.state.deliveryData.delivery.id) {
      return;
    }
    this.setState({ notesLoading: true });
    const Api = new PakkasmarjaApi();
    const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const deliveryNotes: DeliveryNote[] = await deliveriesService.listDeliveryNotes(this.state.deliveryData.delivery.id);
    if (deliveryNotes[0]) {
      const deliveryNotesImg64 = await deliveryNotes.map(async (note) => {
        if (note.image) {
          return { text: note.text, url64: await this.getImage(note.image) }
        } else {
          return { text: note.text }
        }
      });
      const notes64 = await Promise.all(deliveryNotesImg64);
      this.setState({ notes64 });
    }
    this.setState({ deliveryNotes });
    this.setState({ notesLoading: false });
  }

  /**
   * Get image
   */
  private getImage = async (imageUrl: string) => {
    if (!this.props.accessToken) {
      return;
    }
    const fileService = new FileService(REACT_APP_API_URL, this.props.accessToken.access_token);
    const imageData = await fileService.getFile(imageUrl);
    const imageBase64 = `data:image/jpeg;base64,${imageData}`
    return imageBase64;
  }

  /**
   * Renders delivery notes
   */
  private renderDeliveryNotes = (): JSX.Element => {
    if (this.state.notesLoading) {
      return (
        <View style={[styles.loaderContainer, { flex: 1, flexDirection: "column" }]}>
          <View style={{ flex: 1 }}>
            <ActivityIndicator size="large" color="#E51D2A" />
          </View >
          <View style={{ flex: 1, height: 20, alignItems: "center", justifyContent: "center" }}>
            <Text>Ladataan huomioita...</Text>
          </View>
        </View>
      );
    }
    if (!this.state.notes64) {
      return <React.Fragment></React.Fragment>;
    }
    return (
      <View style={{ flex: 1 }}>
        {
          this.state.notes64.map((deliveryNote, index) => {
            return (
              <View style={{ flex: 1, paddingVertical: 10, borderBottomColor: 'grey', borderBottomWidth: 1, }} key={deliveryNote.text || "" + index}>
                <Text style={{ flex: 1, paddingVertical: 5, fontSize: 15 }}>Huomio {index + 1}:</Text>
                {
                  deliveryNote.url64 &&
                  <Lightbox
                    navigator={this.props.navigation.navigator}
                    springConfig={{ tension: 20, friction: 10 }}
                    underlayColor="transparent"
                    backgroundColor="black"
                    onOpen={() => this.setState({ lightBoxOpen: true })}
                    onClose={() => this.setState({ lightBoxOpen: false })}
                  >
                    <Image
                      source={{ uri: deliveryNote.url64 }}
                      style={this.state.lightBoxOpen ? { flex: 1, alignSelf: "center", height: Dimensions.get('screen').height, width: Dimensions.get('screen').width, resizeMode:"contain" } : { flex: 1, alignSelf: "center", width: 200, height: 200, resizeMode: 'contain', marginBottom: 10 }}
                    />
                  </Lightbox>
                }
                <Text style={{ flex: 1, color: "black", fontSize: 14 }}>{deliveryNote.text}</Text>

              </View>
            );
          })
        }
      </View>
    );
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
            <View style={{ flex: 0.7 }}>
              <Text style={{ fontSize: 15 }}>Tuote</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>{`${this.state.deliveryData.product.name}`}</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.7 }}>
              <Text style={{ fontSize: 15 }}>Määrä ({this.state.deliveryData.product.unitName})</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>{this.state.deliveryData.delivery.amount}</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.7 }}>
              <Text style={{ fontSize: 15 }}>Kiloa</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>{this.state.deliveryData.delivery.amount * (this.state.deliveryData.product.units * this.state.deliveryData.product.unitSize)}</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.7 }}>
              <Text style={{ fontSize: 15 }}>Toimituspäivä</Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <Moment element={Text} style={{ color: "black", fontSize: 15 }} format="DD.MM.YYYY">{this.state.deliveryData.delivery.time.toString()}</Moment>
              <Text style={{ color: "black", fontSize: 15 }}>{moment(this.state.deliveryData.delivery.time).utc().hours() > 12 ? ` - Jälkeen klo 11` : ` - Ennen kello 11`}</Text>
            </View>
          </View>
          {this.state.deliveryQuality &&
            <View style={{ flex: 1, flexDirection: 'row', alignItems: "center", paddingVertical: 5, height: 60 }}>
              <View style={{ flex: 0.7 }}>
                <Text style={{ fontSize: 15 }}>Laatuluokka</Text>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.deliveryQualityRoundView, { backgroundColor: this.state.deliveryQuality.color || "grey" }]} >
                  <Text style={[styles.deliveryQualityRoundViewText, { fontSize: 15 }]}>{this.state.deliveryQuality.name.slice(0, 1).toUpperCase()}</Text>
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
                              <Text style={{ fontSize: 15, color: "#e01e36" }} >
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
                      <Text style={{ fontSize: 15, color: "#e01e36" }} >
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
              <React.Fragment>
                <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
                  <View style={{ flex: 0.7 }}>
                    <Text style={{ fontSize: 15 }}>Maksettu hinta</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: "black" }}>{this.state.deliveryData.delivery.price}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, marginTop: 30 }}>
                  {this.renderDeliveryNotes()}
                </View>
              </React.Fragment>
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
