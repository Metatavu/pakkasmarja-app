import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { Delivery } from "pakkasmarja-client";
import { styles } from "./styles.tsx";
import { Text } from 'react-native-elements';
import Moment from "react-moment";

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
  editable: boolean;
  deliveryData?: DeliveryProduct;
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
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    const deliveryData: DeliveryProduct = this.props.navigation.getParam('deliveryData');
    const editable: boolean = this.props.navigation.getParam('editable');
    this.setState({ editable: editable, deliveryData: deliveryData });
    console.log(this.state.deliveryData);

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
    if (!this.state.deliveryData || !this.state.deliveryData.product || !this.state.deliveryData.delivery.time) {
      return <Text></Text>;
    }
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={{ flex: 1, padding: 25 }}>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 16 }}>Tuote</Text></View>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 16 }}>{`${this.state.deliveryData.product.name} ${this.state.deliveryData.product.unitSize} G x ${this.state.deliveryData.product.units}`}</Text></View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 16 }}>Määrä (KG)</Text></View>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 16 }}>{this.state.deliveryData.delivery.amount}</Text></View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 5 }}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 16 }}>Toimituspäivä</Text></View>
            <View style={{ flex: 1 }}><Moment element={Text} format="DD.MM.YYYY">{this.state.deliveryData.delivery.time.toString()}</Moment></View>
          </View>
          {
            this.state.editable &&
            <React.Fragment>
              <View style={[styles.center, { flex: 1, paddingVertical: 25 }]}>
                <TouchableOpacity onPress={() => { console.log("Muokkaa napista") }}>
                  <View style={[styles.center, { flex: 1, flexDirection: "row" }]}>
                    <Text style={[styles.red, { fontWeight: "bold", fontSize: 18, textDecorationLine: "underline" }]} >Muokkaa</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={[styles.center, { flex: 1 }]}>
                <TouchableOpacity
                  style={[styles.begindeliveryButton, styles.center, { width: "70%", height: 60 }]}
                  onPress={() => { console.log("Hello") }}>
                  <Text style={{ color: '#f2f2f2', fontWeight: "600" }}>Aloita toimitus</Text>
                </TouchableOpacity>
              </View>
            </React.Fragment>
          }
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

export default connect(mapStateToProps, mapDispatchToProps)(DeliveryScreen);
