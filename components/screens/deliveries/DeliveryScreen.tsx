import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct, DeliveriesState } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight, Image, Dimensions, Alert } from "react-native";
import { Delivery, DeliveryNote, DeliveryQuality, DeliveryPlace } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import moment from "moment";
import PakkasmarjaApi from "../../../api";
import FeatherIcon from "react-native-vector-icons/Feather";
import Icon from "react-native-vector-icons/EvilIcons";
import CreateDeliveryNoteModal from "./CreateDeliveryNoteModal";
import ViewOrDeleteNoteModal from "./ViewOrDeleteNoteModal";
import { FileService } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import Lightbox from 'react-native-lightbox';
import AsyncButton from "../../generic/async-button";
import { StackNavigationOptions } from '@react-navigation/stack';
import { Text } from "native-base";

/**
 * Component props
 */
interface Props {
  navigation: any;
  route: any;
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

  private navigationFocusEventSubscription: any;

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
          <FeatherIcon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
      )
    }
  };

  /**
   * Component did mount life-cycle event
   */
  public componentDidMount = async () => {
    const { accessToken, navigation } = this.props;

    navigation.setOptions(this.navigationOptions(navigation));

    if (!accessToken) {
      return;
    }

    this.setState({ loading: true });
    await this.loadData();
    this.setState({ loading: false });

    this.navigationFocusEventSubscription = navigation.addListener('focus', this.loadData);
  }

  /**
   * Component will unmount life-cycle event
   */
  public componentWillUnmount = () => {
    this.props.navigation.removeListener(this.navigationFocusEventSubscription);
  }

  /**
   * Handles begin delivery
   */
  private handleBeginDelivery = async () => {
    const { accessToken, navigation } = this.props;
    const { deliveryData } = this.state;
    const { delivery, product } = deliveryData || {};

    if (!accessToken || !product?.id || !delivery?.id) {
      return;
    }


    const updatedDelivery = await new PakkasmarjaApi()
      .getDeliveriesService(accessToken.access_token)
      .updateDelivery({
        id: delivery.id,
        productId: product.id,
        userId: accessToken.userId,
        time: delivery.time,
        status: "DELIVERY",
        amount: delivery.amount,
        price: delivery.price,
        deliveryPlaceId: delivery.deliveryPlaceId
      }, delivery.id);
    this.updateDeliveries(updatedDelivery);
    navigation.navigate("IncomingDeliveries");
  }

  /**
   * Check if products item group is natural
   *
   * @param itemGroupId itemGroupId
   * @returns if item group is natural or not
   */
  private checkIfNatural = async (itemGroupId: string) => {
    const { accessToken } = this.props;

    if (!accessToken) {
      return false;
    }

    const itemGroup = await new PakkasmarjaApi()
      .getItemGroupsService(accessToken.access_token)
      .findItemGroup(itemGroupId);

    const { displayName } = itemGroup;

    const description = 'Vakuutan, että toimituksessa mainittujen marjojen alkuperämaa on Suomi, ja että liitetty kuva on otettu tämän toimituksen marjoista';
    const luomuDescription = "Vakuutan, että toimituksessa mainittujen luomumarjojen alkuperämaa on Suomi, ja että liitetty kuva on otettu tämän toimituksen marjoista. Luomumarjat ovat myös neuvoston asetuksen (EY 834/2007) ja komission asetuksen (EY 889/2008) mukaisesti tuotettu tuote."

    if (displayName) {
      const isNatural = displayName.toLowerCase().includes("luomu");
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
    const { accessToken, navigation } = this.props;
    const { deliveryData } = this.state;
    const { product, delivery } = deliveryData || {};

    if (!accessToken || !product?.id || !delivery?.id) {
      return;
    }

    const updatedDelivery = await new PakkasmarjaApi()
      .getDeliveriesService(accessToken.access_token)
      .updateDelivery({ ...delivery, status: "REJECTED" }, delivery.id);
    this.updateDeliveries(updatedDelivery);
    navigation.navigate("IncomingDeliveries");
  }

  /**
   * Update deliveries
   *
   * @param deliveryToUpdate delivery to update
   */
  private updateDeliveries = (deliveryToUpdate: Delivery) => {
    const { deliveries, deliveriesLoaded, itemGroupCategory } = this.props;

    if (!deliveries) {
      return;
    }

    const { freshDeliveryData, frozenDeliveryData } = deliveries;

    const deliveryData = itemGroupCategory === "FROZEN" ?
      frozenDeliveryData :
      freshDeliveryData;

    const updatedDeliveries = deliveryData.map(data => ({
      ...data,
      delivery: data.delivery.id === deliveryToUpdate.id ?
        deliveryToUpdate :
        data.delivery
    }));

    deliveriesLoaded?.({
      ...deliveries,
      freshDeliveryData: itemGroupCategory === "FRESH" ? updatedDeliveries : freshDeliveryData,
      frozenDeliveryData: itemGroupCategory === "FROZEN" ? updatedDeliveries : frozenDeliveryData
    });
  }

  /**
   * Load data
   */
  private loadData = async () => {
    const { accessToken, route, itemGroupCategory } = this.props;
    const { deliveryId, productId, qualityId, editable } = route.params;
    const { access_token } = accessToken || {};

    if (!access_token) {
      return;
    }

    const Api = new PakkasmarjaApi();
    const deliveryQualities = await Api.getDeliveryQualitiesService(access_token).listDeliveryQualities(itemGroupCategory);
    const delivery = await Api.getDeliveriesService(access_token).findDelivery(deliveryId);
    const product = await Api.getProductsService(access_token).findProduct(productId);
    const deliveryPlace = await Api.getDeliveryPlacesService(access_token).findDeliveryPlace(delivery.deliveryPlaceId);

    this.checkIfNatural(product.itemGroupId);

    this.setState({
      editable: editable,
      deliveryData: { delivery, product },
      deliveryPlace: deliveryPlace,
      deliveryQuality: deliveryQualities.find(({ id }) => id == qualityId)
    });

    this.loadDeliveryNotes();
  }

  /**
   * Load delivery notes
   */
  private loadDeliveryNotes = async () => {
    const { accessToken } = this.props;
    const { deliveryData } = this.state;

    if (!accessToken || !deliveryData?.delivery.id) {
      return;
    }

    this.setState({ notesLoading: true });

    const deliveryNotes: DeliveryNote[] = await new PakkasmarjaApi()
      .getDeliveriesService(accessToken.access_token)
      .listDeliveryNotes(deliveryData.delivery.id);

    if (deliveryNotes[0]) {
      this.setState({
        notes64: await Promise.all(
          deliveryNotes.map(async note => ({
            text: note.text,
            url64: note.image ? await this.getImage(note.image) : undefined
          }))
        )
      });
    }

    this.setState({
      deliveryNotes: deliveryNotes,
      notesLoading: false
    });
  }

  /**
   * Get image
   *
   * @param imageUrl image URL
   */
  private getImage = async (imageUrl: string) => {
    const { accessToken } = this.props;

    if (!accessToken) {
      return;
    }

    const imageData = await new FileService(REACT_APP_API_URL, accessToken.access_token).getFile(imageUrl);
    return `data:image/jpeg;base64,${imageData}`;
  }

  /**
   * Renders delivery notes
   */
  private renderDeliveryNotes = (): JSX.Element => {
    const { navigation } = this.props;
    const { notesLoading, notes64, lightBoxOpen } = this.state;

    if (notesLoading) {
      return (
        <View style={[ styles.loaderContainer, { flex: 1, flexDirection: "column" } ]}>
          <View style={{ flex: 1 }}>
            <ActivityIndicator size="large" color="#E51D2A" />
          </View >
          <View style={{ flex: 1, height: 20, alignItems: "center", justifyContent: "center" }}>
            <Text>Ladataan huomioita...</Text>
          </View>
        </View>
      );
    }

    if (!notes64) {
      return <></>;
    }

    return (
      <View style={{ flex: 1 }}>
        {
          notes64.map((deliveryNote, index) => (
            <View
              style={{ flex: 1, paddingVertical: 10, borderBottomColor: 'grey', borderBottomWidth: 1, }}
              key={ index }
            >
              <Text style={{ flex: 1, paddingVertical: 5, fontSize: 15 }}>Huomio {index + 1}:</Text>
              {
                deliveryNote.url64 &&
                <Lightbox
                  navigator={ navigation.navigator }
                  springConfig={{ tension: 20, friction: 10 }}
                  underlayColor="transparent"
                  backgroundColor="black"
                  onOpen={ () => this.setState({ lightBoxOpen: true }) }
                  onClose={ () => this.setState({ lightBoxOpen: false }) }
                >
                  <Image
                    source={{ uri: deliveryNote.url64 }}
                    style={ lightBoxOpen ?
                      { flex: 1, alignSelf: "center", height: Dimensions.get('screen').height, width: Dimensions.get('screen').width, resizeMode: "contain" } :
                      { flex: 1, alignSelf: "center", width: 200, height: 200, resizeMode: 'contain', marginBottom: 10 }
                    }
                  />
                </Lightbox>
              }
              <Text style={{ flex: 1, color: "black", fontSize: 14 }}>{ deliveryNote.text }</Text>
            </View>
          ))
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

    const { delivery, product } = deliveryData || {};

    if (loading || !product || !delivery?.time) {
      return (
        <View style={ styles.loaderContainer }>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
        <View style={{ flex: 1, padding: 25 }}>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 15 }}>
                Tuote
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>
                { `${product.name}` }
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 15 }}>
                Määrä ({ product.unitName })
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>
                { delivery.amount }
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 15 }}>Kiloa</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>
                { delivery.amount * (product.units * product.unitSize) }
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              { delivery.status === "DONE" || delivery.status === "NOT_ACCEPTED" ?
                <Text style={{ fontSize: 15 }}>
                  { delivery.status === "DONE" ? "Hyväksytty" : "Hylätty" }
                </Text>
                :
                <Text style={{ fontSize: 15 }}>
                  Toimituspäivä
                </Text>
              }
            </View>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              { delivery.status === "DONE" || delivery.status === "NOT_ACCEPTED" ?
                <Text style={{ fontSize: 15, color: "black" }}>
                  { moment(delivery.time).format("DD.MM.YYYY HH:mm") }
                </Text>
                :
                <>
                  <Text style={{ fontSize: 15, color: "black" }}>
                    { moment(delivery.time).format("DD.MM.YYYY") }
                  </Text>
                  <Text style={{ color: "black", fontSize: 15 }}>
                    { ` - klo ${moment(delivery.time).format("HH.mm")}` }
                  </Text>
                </>
              }
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 0.8 }}>
              <Text style={{ fontSize: 15 }}>
                Toimituspaikka
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "black" }}>
                { deliveryPlace?.name }
              </Text>
            </View>
          </View>
          { deliveryQuality &&
            <View style={{ flex: 1, flexDirection: 'row', alignItems: "center", paddingVertical: 5, height: 60 }}>
              <View style={{ flex: 0.8 }}>
                <Text style={{ fontSize: 15 }}>
                  Laatuluokka
                </Text>
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
            <>
              {
                deliveryNotes?.map((deliveryNote: DeliveryNote, index) => (
                  <View key={index} style={[ styles.center, { flex: 1, paddingVertical: 10 } ]}>
                    <TouchableOpacity onPress={ () => this.setState({ deliveryNoteId: deliveryNote.id, editModal: true }) }>
                      <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
                        <Icon
                          size={ 25 }
                          style={{ color: "#e01e36" }}
                          name="pencil"
                        />
                        <Text style={{ fontSize: 15, color: "#e01e36" }}>
                          Katso/poista huomio
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))
              }
              <View style={[ styles.center, { flex: 1, paddingVertical: 10 } ]}>
                <TouchableOpacity onPress={ () => this.setState({ createModal: true }) }>
                  <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
                    <Icon
                      size={ 25 }
                      style={{ color: "#e01e36" }}
                      name="pencil"
                    />
                    <Text style={{ fontSize: 15, color: "#e01e36" }}>
                      Lisää huomio
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
                <Text style={{ color: 'black', fontSize: 15 }}>
                  { this.state.description }
                </Text>
              </View>
              <View style={[ styles.center, { flex: 1, flexDirection: "row" } ]}>
                <AsyncButton
                  style={[ styles.begindeliveryButton, styles.center, { width: "70%", height: 60 } ]}
                  onPress={ this.handleBeginDelivery }>
                  <Text style={{ color: '#f2f2f2', fontWeight: "600" }}>
                    Aloita toimitus
                  </Text>
                </AsyncButton>
              </View>
              <View style={[ styles.center, { flex: 1, flexDirection: "row", marginTop: 20 } ]}>
                <AsyncButton
                  style={[ styles.declineButton, styles.center, { width: "70%", height: 60 } ]}
                  onPress={ this.handleRemoveDelivery }>
                  <Text style={{ color: '#f2f2f2', fontWeight: "600" }}>
                    Hylkää toimitus
                  </Text>
                </AsyncButton>
              </View>
            </>
            :
            <>
              {
                delivery.status === "DONE" &&
                <>
                  <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
                    <View style={{ flex: 0.8 }}>
                      <Text style={{ fontSize: 15 }}>
                        Yksikköhinta ALV 0%
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: "black" }}>
                        { `${delivery.amount == 0 ? 0 : delivery.price} € / ${product?.unitName.toUpperCase() || ""}` }
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
                    <View style={{ flex: 0.8 }}>
                      <Text style={{ fontSize: 15 }}>
                        Yksikköhinta ALV 14%
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: "black" }}>
                        { `${delivery.amount == 0 ? 0 : (Number(delivery.price) * alvAmount).toFixed(3)} € / ${product?.unitName.toUpperCase() || ""}` }
                      </Text>
                    </View>
                  </View>
                </>
              }
              <View style={{ flex: 1, marginTop: 30 }}>
                { this.renderDeliveryNotes() }
              </View>
            </>
          }
        </View>
        <CreateDeliveryNoteModal
          loadDeliveryNotes={ this.loadDeliveryNotes }
          deliveryId={ delivery.id || "" }
          modalClose={ () => this.setState({ createModal: false }) }
          modalOpen={ createModal }
        />
        <ViewOrDeleteNoteModal
          loadDeliveryNotes={ this.loadDeliveryNotes }
          deliveryId={ delivery.id || "" }
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
