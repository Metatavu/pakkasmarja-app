import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight, Image, Dimensions, Alert, } from "react-native";
import { Delivery, Product, DeliveryNote, DeliveryQuality, DeliveryPlace } from "pakkasmarja-client";
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
import AsyncButton from "../../generic/async-button";

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
  deliveryPlace?: DeliveryPlace;
  description: string;
  alvAmount: number;
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
      lightBoxOpen: false,
      description: "",
      alvAmount: 1.14
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
   * Check if prodcuts itemgroup is natural
   * 
   * @param itemGroupId itemGroupId
   * @returns if itemgroup is natural or not
   */
  private checkIfNatural = async (itemGroupId: string) => {
    if (!this.props.accessToken) {
      return false;
    }
    const Api = new PakkasmarjaApi();
    const itemGroupService = Api.getItemGroupsService(this.props.accessToken.access_token);
    const itemGroup = await itemGroupService.findItemGroup(itemGroupId);
    const itemGroupDisplayName = itemGroup.displayName;
    const description = 'Vakuutan, että toimituksessa mainittujen marjojen alkuperämaa on Suomi, ja että liitetty kuva on otettu tämän toimituksen marjoista';
    const luomuDescription = "Vakuutan, että toimituksessa mainittujen luomumarjojen alkuperämaa on Suomi, ja että liitetty kuva on otettu tämän toimituksen marjoista. Luomumarjat ovat myös neuvoston asetuksen (EY 834/2007) ja komission asetuksen (EY 889/2008) mukaisesti tuotettu tuote."
    if (itemGroupDisplayName) {
      const isNatural = itemGroupDisplayName.toLowerCase().includes("luomu");
      this.setState({ description: isNatural ? luomuDescription : description });
    }
  }

  /**
   * Handles removing delivery
   */
  private handleRemoveDelivery = async () => {
    Alert.alert(
      'Hylkää toimitus!',
      `Haluatko varmasti hylkää toimituksen?`,
      [
        {
          text: 'En halua', onPress: () => { }
        },
        {
          text: 'Kyllä', onPress: () => this.removeDelivery()
        }
      ]
    );
  }

  /**
   * Removes delivery
   */
  private removeDelivery = async () => {
    if (!this.props.accessToken || !this.state.deliveryData || !this.state.deliveryData.product || !this.state.deliveryData.delivery.id || !this.state.deliveryData.product.id) {
      return;
    }
    const Api = new PakkasmarjaApi();
    const deliveryService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const delivery = this.state.deliveryData.delivery;
    const updatedDelivery = await deliveryService.updateDelivery({ ...delivery, status: "REJECTED" }, this.state.deliveryData.delivery.id);
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
    const deliveryPlace = await Api.getDeliveryPlacesService(this.props.accessToken.access_token).findDeliveryPlace(delivery.deliveryPlaceId);
    const deliveryData = { delivery, product }

    const itemGroupId = product.itemGroupId;
    this.checkIfNatural(itemGroupId);
    this.setState({ editable: editable, deliveryData: deliveryData, deliveryPlace });
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
                      style={this.state.lightBoxOpen ? { flex: 1, alignSelf: "center", height: Dimensions.get('screen').height, width: Dimensions.get('screen').width, resizeMode: "contain" } : { flex: 1, alignSelf: "center", width: 200, height: 200, resizeMode: 'contain', marginBottom: 10 }}
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
    const { navigation } = this.props;
    const {
      loading,
      deliveryData,
      deliveryPlace,
      deliveryQuality,
      editable,
      deliveryNotes,
      alvAmount,
      createModal,
      editModal,
      deliveryNoteId
    } = this.state;

    if (loading || !deliveryData || !deliveryData.product || !deliveryData.delivery.time) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }
    const { status } = deliveryData.delivery;
    return (
      <BasicScrollLayout navigation={ this.props.navigation } backgroundColor="#fff" displayFooter={ true }>
        <NavigationEvents onWillFocus={ () => this.loadData() } />
        <View style={{ flex: 1, padding: 25 }}>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 15 }}>Tuote</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>
                { `${deliveryData.product.name}` }
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 15 }}>
                Määrä ({ deliveryData.product.unitName })
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>
                { deliveryData.delivery.amount }
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 15 }}>Kiloa</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>
                { deliveryData.delivery.amount * (deliveryData.product.units * deliveryData.product.unitSize) }
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              { status === "DONE" || status === "NOT_ACCEPTED" ?
                <Text style={{ fontSize: 15 }}>
                  { status === "DONE" ? "Hyväksytty" : "Hylätty" }
                </Text>
                :
                <Text style={{ fontSize: 15 }}>Toimituspäivä</Text>
              }
            </View>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              { status === "DONE" || status === "NOT_ACCEPTED" ?
                <Moment element={ Text } style={{ color: "black", fontSize: 15 }} format="DD.MM.YYYY HH:mm">
                  { deliveryData.delivery.time.toString() }
                </Moment>
                :
                <React.Fragment>
                  <Moment element={ Text } style={{ color: "black", fontSize: 15 }} format="DD.MM.YYYY">
                    { deliveryData.delivery.time.toString() }
                  </Moment>
                  <Text style={{ color: "black", fontSize: 15 }}>
                    {` - klo ${moment(deliveryData.delivery.time).format("HH.mm")}`}
                  </Text>
                </React.Fragment>
              }
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 15 }}>Toimituspaikka</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>{deliveryPlace ? deliveryPlace.name : ""}</Text>
            </View>
          </View>
          { deliveryQuality &&
            <View style={{ flex: 1, flexDirection: 'row', alignItems: "center", paddingVertical: 5, height: 60 }}>
              <View style={{ flex: 0.8 }}>
                <Text style={{ fontSize: 15 }}>Laatuluokka</Text>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={[ styles.deliveryQualityRoundView, { backgroundColor: deliveryQuality.color || "grey" } ]}>
                  <Text style={[ styles.deliveryQualityRoundViewText, { fontSize: 15 } ]}>
                    { deliveryQuality.displayName.slice(0, 1).toUpperCase() }
                  </Text>
                </View>
                <View >
                  <Text style={{ color: "black", fontSize: 14, fontWeight: "400", marginBottom: 4 }}>
                    { deliveryQuality.displayName }
                  </Text>
                </View>
              </View>
            </View>
          }
          { editable ?
            <React.Fragment>
              { deliveryNotes ?
                deliveryNotes.map((deliveryNote: DeliveryNote, index) => {
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
                :
                null
              }
              <View style={[ styles.center, { flex: 1, paddingVertical: 10 } ]}>
                <TouchableOpacity onPress={ () => this.setState({ createModal: true }) }>
                  <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
                    <Icon size={ 25 } style={{ color: "#e01e36" }} name="pencil" />
                    <Text style={{ fontSize: 15, color: "#e01e36" }} >
                      { `Lisää huomio` }
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[ styles.center, { flex: 1, paddingVertical: 25 } ]}>
                <TouchableOpacity onPress={ () => navigation.navigate("EditDelivery", { deliveryData }) }>
                  <View style={[ styles.center, { flexDirection: "row" } ]}>
                    <Text style={[ styles.red, { fontWeight: "bold", fontSize: 18, textDecorationLine: "underline" } ]}>
                      Muokkaa
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[ styles.center, { flex: 1, marginBottom: 20 } ]}>
                <Text style={{ color: 'black', fontSize: 15 }}>{ this.state.description }</Text>
              </View>
              <View style={[ styles.center, { flex: 1 } ]}>
                <AsyncButton
                  style={[ styles.begindeliveryButton, styles.center, { width: "70%", height: 60 } ]}
                  onPress={ this.handleBeginDelivery }>
                  <Text style={{ color: '#f2f2f2', fontWeight: "600" }}>Aloita toimitus</Text>
                </AsyncButton>
              </View>
              <View style={[ styles.center, { flex: 1, marginTop: 20 } ]}>
                <AsyncButton
                  style={[ styles.declineButton, styles.center, { width: "70%", height: 60 } ]}
                  onPress={ this.handleRemoveDelivery }>
                  <Text style={{ color: '#f2f2f2', fontWeight: "600" }}>Hylkää toimitus</Text>
                </AsyncButton>
              </View>
            </React.Fragment>
            :
            <React.Fragment>
              {
                status === "DONE" &&
                <React.Fragment>
                  <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
                    <View style={{ flex: 0.8 }}>
                      <Text style={{ fontSize: 15 }}>Yksikköhinta ALV 0%</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: "black" }}>
                        {`${deliveryData.delivery.amount == 0 ? 0 : deliveryData.delivery.price} € / ${deliveryData.product ? deliveryData.product.unitName.toUpperCase() : ""}`}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
                    <View style={{ flex: 0.8 }}>
                      <Text style={{ fontSize: 15 }}>Yksikköhinta ALV 14%</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: "black" }}>
                        {`${deliveryData.delivery.amount == 0 ? 0 : (Number(deliveryData.delivery.price) * alvAmount).toFixed(3)} € / ${deliveryData.product ? deliveryData.product.unitName.toUpperCase() : ""}`}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              }
              <View style={{ flex: 1, marginTop: 30 }}>
                { this.renderDeliveryNotes() }
              </View>
            </React.Fragment>
          }
        </View>
        <CreateDeliveryNoteModal
          loadDeliveryNotes={ this.loadDeliveryNotes }
          deliveryId={ deliveryData.delivery.id || "" }
          modalClose={ () => this.setState({ createModal: false }) }
          modalOpen={ createModal }
        />
        <ViewOrDeleteNoteModal
          loadDeliveryNotes={ this.loadDeliveryNotes }
          deliveryId={ deliveryData.delivery.id || "" }
          deliveryNoteId={ deliveryNoteId || "" }
          modalClose={ () => this.setState({ editModal: false }) }
          modalOpen={ editModal }
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
