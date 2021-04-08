import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight, Dimensions, Image, Alert } from "react-native";
import { Delivery, Product, ItemGroupCategory, ProductPrice, DeliveryNote } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text } from 'react-native-elements';
import Moment from "react-moment";
import PakkasmarjaApi from "../../../api";
import NumericInput from 'react-native-numeric-input'
import { Thumbnail } from "native-base";
import { PREDICTIONS_ICON } from "../../../static/images";
import Icon from "react-native-vector-icons/Feather";
import EntypoIcon from "react-native-vector-icons/Entypo";
import Lightbox from 'react-native-lightbox';
import { FileService } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import moment from "moment";
import { roundPrice } from "../../../utils/utility-functions";

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
  productPrice?: ProductPrice;
  amount: number;
  notesLoading: boolean;
  lightBoxOpen: boolean;
  notes64?: { text: string | undefined, url64?: string }[];
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
      lightBoxOpen: false,
      modalOpen: false,
      notesLoading: false,
      amount: 0
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
    if (!this.props.accessToken) {
      return;
    }
    this.loadData();
  }

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
      amount: this.state.amount,
      price: this.state.delivery.price,
      deliveryPlaceId: this.state.delivery.deliveryPlaceId
    }
    const updatedDelivery = await deliveriesService.updateDelivery(delivery, this.state.delivery.id);
    this.updateDeliveries(updatedDelivery);
    this.props.navigation.navigate("Proposals");
  }

  /**
   * Handles declining proposal
   */
  private handleProposalDecline = async () => {
    Alert.alert(
      'Hylkää ehdotus!',
      `Haluatko varmasti hylkää ehdotuksen?`,
      [
        {
          text: 'En halua', onPress: () => { }
        },
        {
          text: 'Kyllä', onPress: () => this.declineProposal()
        }
      ]
    );
  }

  /**
   * Declines proposal
   */
  private declineProposal = async () => {
    if (!this.props.accessToken || !this.state.product || !this.state.product.id || !this.state.delivery || !this.state.delivery.id) {
      return;
    }
    const Api = new PakkasmarjaApi();
    const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const delivery: Delivery = this.state.delivery;
    const updatedDelivery = await deliveriesService.updateDelivery({ ...delivery, status: "REJECTED" }, this.state.delivery.id);
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
    if (!this.props.accessToken) {
      return;
    }
    this.setState({ loading: true });
    const deliveryId: string = this.props.navigation.getParam('deliveryId');
    const deliveriesAndProducts: DeliveryProduct[] = this.getDeliveries();
    const selectedDelivery: DeliveryProduct | undefined = deliveriesAndProducts.find(deliveryData => deliveryData.delivery.id === deliveryId);
    if (selectedDelivery && selectedDelivery.product && selectedDelivery.product.id) {
      const Api = new PakkasmarjaApi();
      const productPricesService = await Api.getProductPricesService(this.props.accessToken.access_token);
      const productPrice: ProductPrice[] = await productPricesService.listProductPrices(selectedDelivery.product.id, "CREATED_AT_DSC", undefined, undefined, 1);
      this.setState({
        delivery: selectedDelivery.delivery,
        product: selectedDelivery.product,
        productPrice: productPrice[0],
        amount: selectedDelivery.delivery.amount
      }, () => this.loadDeliveryNotes());
    }
    this.setState({ loading: false });
  }

  /**
 * Load delivery notes
 */
  private loadDeliveryNotes = async () => {
    if (!this.props.accessToken || !this.state.delivery || !this.state.delivery.id) {
      return;
    }
    this.setState({ notesLoading: true });
    const Api = new PakkasmarjaApi();
    const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);
    const deliveryNotes: DeliveryNote[] = await deliveriesService.listDeliveryNotes(this.state.delivery.id);
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
                      style={this.state.lightBoxOpen ? { flex: 1, alignSelf: "center", height: Dimensions.get('screen').height, width: Dimensions.get('screen').width, resizeMode: "contain" } : { flex: 1, alignSelf: "center", width: 200, height: 100, resizeMode: 'contain', marginBottom: 10 }}
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
    if (this.state.loading || !this.state.delivery || !this.state.product) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }
    const kilograms = this.state.amount * (this.state.product.units * this.state.product.unitSize);
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
                {`${this.state.product.name}`}
              </Text>
            }
          </View>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingBottom: 5, }}>
            <View style={{ flex: 0.1 }}>
              <EntypoIcon
                name='info-with-circle'
                color='#e01e36'
                size={20}
              />
            </View >
            <View style={{ flex: 1.1 }}>
              {
                this.state.productPrice &&
                <Text style={styles.textPrediction}>{`Tämän hetkinen hinta ${this.state.productPrice.price} € / ${this.state.productPrice.unit.toUpperCase()} ALV 0% (${roundPrice(parseFloat(this.state.productPrice.price) * 1.14)} ALV 14%)`}</Text>
              }
            </View>
          </View>
          <View >
            <Text style={[styles.textWithSpace, { marginLeft: 5, color: "black" }]}>
              Ehdotettu määrä ({this.state.product.unitName})
              </Text>
          </View>
          <View style={[styles.center, styles.numericInputContainer]}>
            <NumericInput
              value={this.state.amount}
              initValue={this.state.amount}
              onChange={(value: number) => { this.setState({ amount: value }) }}
              totalWidth={Dimensions.get('window').width - (styles.deliveryContainer.padding * 2) - 20}
              totalHeight={50}
              iconSize={35}
              step={10}
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
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={styles.textPrediction}>{`= ${kilograms} KG`}</Text>
          </View>
          <View style={{ flex: 1, flexDirection: "row" }}>
            <View style={styles.center}>
              <Text style={[styles.textPrediction, { marginVertical: 10 }]}>Toimituspäivä</Text>
              <View style={{ flexDirection: "row" }}>
                <Thumbnail square source={PREDICTIONS_ICON} style={{ width: 20, height: 22, marginRight: 10 }} />
                <Moment style={{ fontWeight: "bold", fontSize: 16, color: "black" }} element={Text} format="DD.MM.YYYY">
                  {this.state.delivery.time && this.state.delivery.time.toString()}
                </Moment>
                <Text style={{ fontWeight: "bold", fontSize: 16, color: "black" }}>{moment(this.state.delivery.time).utc().hours() > 12 ? ` - Jälkeen klo 12` : ` - Ennen klo 12`}</Text>
              </View>
            </View>
          </View>
          <View style={{ flex: 1, marginTop: 30 }}>
            {this.renderDeliveryNotes()}
          </View>
          <View style={[styles.center, { flex: 1 }]}>
            <View style={{ flex: 1, flexDirection: "row", marginTop: 15 }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                <TouchableOpacity style={[styles.declineButton, { width: "95%", height: 60 }]} onPress={() => this.props.navigation.goBack()} >
                  <Text style={styles.buttonText}>Peruuta</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end" }}>
                <TouchableOpacity style={[styles.declineButton, { width: "95%", height: 60 }]} onPress={() => { this.handleProposalDecline() }} >
                  <Text style={styles.buttonText}>Hylkää</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: 1, flexDirection: "row", marginTop: 15 }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
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
