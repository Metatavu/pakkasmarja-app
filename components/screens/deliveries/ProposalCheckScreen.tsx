import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity, TouchableHighlight, Dimensions, Image, Alert } from "react-native";
import { Delivery, Product, ItemGroupCategory, ProductPrice, DeliveryNote } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import PakkasmarjaApi from "../../../api";
import NumericInput from 'react-native-numeric-input'
import { Thumbnail, Text } from "native-base";
import { PREDICTIONS_ICON } from "../../../static/images";
import Icon from "react-native-vector-icons/Feather";
import EntypoIcon from "react-native-vector-icons/Entypo";
import Lightbox from 'react-native-lightbox';
import { FileService } from "../../../api/file.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import moment from "moment";
import { roundPrice } from "../../../utils/utility-functions";
import AsyncButton from "../../generic/async-button";
import { StackNavigationOptions } from '@react-navigation/stack';

/**
 * Component props
 */
interface Props {
  navigation: any;
  route: any;
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
          <Icon
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
  public async componentDidMount() {
    const { accessToken, navigation } = this.props;

    navigation.setOptions(this.navigationOptions(navigation));

    if (!accessToken) {
      return;
    }

    this.loadData();
  }

  /**
   * Handle proposal accept
   */
  private handleProposalAccept = async () => {
    const { accessToken, navigation } = this.props;
    const { product, delivery, amount } = this.state;

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
        status: "PLANNED",
        amount: amount,
        price: delivery.price,
        deliveryPlaceId: delivery.deliveryPlaceId
      }, delivery.id);

    this.updateDeliveries(updatedDelivery);

    navigation.navigate("Proposals");
  }

  /**
   * Handles declining proposal
   */
  private handleProposalDecline = async () => {
    Alert.alert(
      'Hylkää ehdotus!',
      `Haluatko varmasti hylätä ehdotuksen?`,
      [
        { text: 'Ei', onPress: () => { } },
        { text: 'Kyllä', onPress: this.declineProposal }
      ]
    );
  }

  /**
   * Declines proposal
   */
  private declineProposal = async () => {
    const { accessToken, navigation } = this.props;
    const { product, delivery } = this.state;

    if (!accessToken || !product?.id || !delivery?.id) {
      return;
    }

    const updatedDelivery = await new PakkasmarjaApi()
      .getDeliveriesService(accessToken.access_token)
      .updateDelivery({ ...delivery, status: "REJECTED" }, delivery.id);

    this.updateDeliveries(updatedDelivery);

    navigation.navigate("Proposals");
  }

  /**
   * Update deliveries
   *
   * @param delivery delivery
   */
  private updateDeliveries = (delivery: Delivery) => {
    const { deliveries, itemGroupCategory, deliveriesLoaded } = this.props;

    if (!deliveries) {
      return;
    }

    const updatedDeliveries = this.getDeliveries().map(deliveryData => ({
      delivery: deliveryData.delivery.id === delivery.id ? delivery : deliveryData.delivery,
      product: deliveryData.product
    }));

    deliveriesLoaded?.({
      ...deliveries,
      frozenDeliveryData: itemGroupCategory === "FROZEN" ? updatedDeliveries : deliveries.frozenDeliveryData,
      freshDeliveryData: itemGroupCategory === "FRESH" ? updatedDeliveries : deliveries.freshDeliveryData
    });
  }

  /**
   * Get deliveries
   *
   * @return deliveries
   */
  private getDeliveries = () => {
    const { deliveries, itemGroupCategory } = this.props;

    if (!deliveries) {
      return [];
    }

    return itemGroupCategory === "FROZEN" ?
      deliveries.frozenDeliveryData :
      deliveries.freshDeliveryData;
  }

  /**
   * Load data
   */
  private loadData = async () => {
    const { accessToken, route } = this.props;

    if (!accessToken) {
      return;
    }

    const deliveryId: string | undefined = route.params?.deliveryId;

    if (!deliveryId) {
      return;
    }

    const deliveriesAndProducts = this.getDeliveries();
    const selectedDelivery = deliveriesAndProducts.find(({ delivery }) => delivery.id === deliveryId);

    if (!selectedDelivery?.product?.id) {
      return;
    }

    this.setState({ loading: true });

    const productPrice = await new PakkasmarjaApi()
      .getProductPricesService(accessToken.access_token)
      .listProductPrices(selectedDelivery.product.id, "CREATED_AT_DSC", undefined, undefined, 1);

    this.setState({
      delivery: selectedDelivery.delivery,
      product: selectedDelivery.product,
      productPrice: productPrice[0],
      amount: selectedDelivery.delivery.amount,
      loading: false
    }, this.loadDeliveryNotes);
  }

  /**
 * Load delivery notes
 */
  private loadDeliveryNotes = async () => {
    const { accessToken } = this.props;
    const { delivery } = this.state;

    if (!accessToken || !delivery?.id) {
      return;
    }

    this.setState({ notesLoading: true });

    const deliveryNotes = await new PakkasmarjaApi()
      .getDeliveriesService(accessToken.access_token)
      .listDeliveryNotes(delivery.id);

    if (deliveryNotes[0]) {
      const deliveryNotesImg64 = deliveryNotes.map(async note => ({
        text: note.text,
        url64: note.image ? await this.getImage(note.image) : undefined
      }));

      this.setState({ notes64: await Promise.all(deliveryNotesImg64) });
    }

    this.setState({ notesLoading: false });
  }

  /**
   * Get image
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
            <ActivityIndicator size="large" color="#E51D2A"/>
          </View >
          <View style={{ flex: 1, height: 20, alignItems: "center", justifyContent: "center" }}>
            <Text>
              Ladataan huomioita...
            </Text>
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
              key={ deliveryNote.text || "" + index }
            >
              <Text style={{ flex: 1, paddingVertical: 5, fontSize: 15 }}>
                Huomio { index + 1 }:
              </Text>
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
                      { flex: 1, alignSelf: "center", width: 200, height: 100, resizeMode: 'contain', marginBottom: 10 }
                    }
                  />
                </Lightbox>
              }
              <Text style={{ flex: 1, color: "black", fontSize: 14 }}>
                { deliveryNote.text }
              </Text>
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
    const { loading, delivery, product, amount, productPrice } = this.state;

    if (loading || !delivery || !product) {
      return (
        <View style={ styles.loaderContainer }>
          <ActivityIndicator size="large" color="#E51D2A"/>
        </View>
      );
    }

    const kilograms = amount * (product.units * product.unitSize);

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
        <View style={[ styles.center, styles.topViewWithButton ]}>
          <View style={{ flex: 1, flexDirection: "row", marginVertical: 30 }}>
            <View style={{ flex: 0.9 }}>
              <Text style={ styles.textPrediction }>
                Hei! Ehdotamme, että toimittaisitte meille seuraavan toimituksen.
              </Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, padding: 15 }}>
          <View style={{ flex: 1 }}>
            { product &&
              <Text style={[ styles.contentHeader, { color: "black" } ]}>
                product.name
              </Text>
            }
          </View>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingBottom: 5, }}>
            <View style={{ flex: 0.1 }}>
              <EntypoIcon
                name="info-with-circle"
                color="#e01e36"
                size={ 20 }
              />
            </View>
            <View style={{ flex: 1.1 }}>
              { productPrice &&
                <Text style={ styles.textPrediction }>
                  {`Tämän hetkinen hinta ${productPrice.price} € / ${productPrice.unit.toUpperCase()} ALV 0% (${roundPrice(parseFloat(productPrice.price) * 1.14)} ALV 14%)`}
                </Text>
              }
            </View>
          </View>
          <View >
            <Text style={[ styles.textWithSpace, { marginLeft: 5, color: "black" } ]}>
              Ehdotettu määrä ({product.unitName})
              </Text>
          </View>
          <View style={[ styles.center, styles.numericInputContainer ]}>
            <NumericInput
              value={ amount }
              initValue={ amount }
              onChange={ (value: number) => this.setState({ amount: value }) }
              totalWidth={ Dimensions.get('window').width - (styles.deliveryContainer.padding * 2) - 20 }
              totalHeight={ 50 }
              iconSize={ 35 }
              step={ 10 }
              valueType="real"
              minValue={ 0 }
              textColor="black"
              rightButtonBackgroundColor="#e01e36"
              leftButtonBackgroundColor="#e01e36"
              borderColor="transparent"
              rounded
            />
          </View>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={ styles.textPrediction }>
              {`= ${kilograms} KG`}
            </Text>
          </View>
          <View style={{ flex: 1, flexDirection: "row" }}>
            <View style={ styles.center }>
              <Text style={[ styles.textPrediction, { marginVertical: 10 } ]}>
                Toimituspäivä
              </Text>
              <View style={{ flexDirection: "row" }}>
                <Thumbnail
                  square
                  source={ PREDICTIONS_ICON }
                  style={{ width: 20, height: 22, marginRight: 10 }}
                />
                { delivery.time &&
                  <Text style={{ fontWeight: "bold", fontSize: 16, color: "black" }}>
                    { moment(delivery.time).format("DD.MM.YYYY") }
                  </Text>
                }
                <Text style={{ fontWeight: "bold", fontSize: 16, color: "black" }}>
                  { moment.utc(delivery.time).format("HH.mm") }
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flex: 1, marginTop: 30 }}>
            { this.renderDeliveryNotes() }
          </View>
          <View style={[ styles.center, { flex: 1 } ]}>
            <View style={{ flex: 1, flexDirection: "row", marginTop: 15 }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                <TouchableOpacity
                  style={[ styles.declineButton, { width: "95%", height: 60 } ]}
                  onPress={ navigation.goBack }
                >
                  <Text style={ styles.buttonText }>
                    Peruuta
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end" }}>
                <AsyncButton
                  style={[ styles.declineButton, { width: "95%", height: 60 } ]}
                  onPress={ this.handleProposalDecline }
                >
                  <Text style={ styles.buttonText }>
                    Hylkää
                  </Text>
                </AsyncButton>
              </View>
            </View>
            <View style={{ flex: 1, flexDirection: "row", marginTop: 15 }}>
              <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "flex-start" }}>
                <AsyncButton
                  style={[ styles.deliveriesButton, { width: "95%", height: 60 } ]}
                  onPress={ this.handleProposalAccept }
                >
                  <Text style={ styles.buttonText }>
                    Hyväksy
                  </Text>
                </AsyncButton>
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
