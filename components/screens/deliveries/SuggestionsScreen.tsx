import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveryData } from "../../../types";
import * as actions from "../../../actions";
import { Text } from "native-base";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { styles } from "./styles.tsx";

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
  data: DeliveryData[];
};

/**
 * Suggestions component class
 */
class SuggestionsScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      data: []
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    const data: DeliveryData[] = [{
      product: "Mansikka 500g x 6",
      mainVariety: "",
      quantity: 1000,
      packingWish: "wish",
      deliveryDate: new Date(),
      deliveryTime: "Ennen 11",
      comment: "comment",
      status: "NOT_ACCEPTED"
    }, {
      product: "Mansikka 600g x 3",
      mainVariety: "",
      quantity: 1420,
      packingWish: "wish2",
      deliveryDate: new Date(),
      deliveryTime: "Ennen 13",
      comment: "comment",
      status: "ACCEPTED"
    }];

    this.setState({ data: data });
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
          <View>
            <Text>Ehdotukset</Text>
          </View>
          <View>
            {
              this.state.data.map((dat) => {
                return (
                  <View style={{flex: 0, flexDirection: "column"}}>
                    <View style={{width: "70%"}}>
                      {dat.product}
                    </View>
                    <View style={{width: "30%"}}>
                      <TouchableOpacity >
                        <Text>Tarkasta</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            }
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

export default connect(mapStateToProps, mapDispatchToProps)(SuggestionsScreen);
