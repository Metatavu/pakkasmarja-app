import { createStackNavigator, createAppContainer } from "react-navigation";
import React from "react";
import LoginScreen from "./components/screens/LoginScreen";
import MainScreen from "./components/screens/MainScreen";
import ContractsScreen from "./components/screens/contracts/ContractsScreen";
import ContractScreen from "./components/screens/contracts/ContractScreen";
import ContractTerms from "./components/screens/contracts/ContractTerms";
import NewsListScreen from "./components/screens/news/NewsListScreen";
import NewsArticleScreen from "./components/screens/news/NewsArticleScreen";
import { createStore } from 'redux';
import { StoreState } from "./types";
import { AppAction } from "./actions";
import { reducer } from "./reducers";
import { Provider } from "react-redux";
import AuthRefresh from "./components/AuthRefresh";
import MqttConnector from "./components/MqttConnector";
import ChatsListScreen from "./components/screens/chats/ChatsListScreen";
import { Root } from "native-base";
import DeliveriesScreen from "./components/screens/deliveries/DeliveriesScreen";
import DeliveryScreen from "./components/screens/deliveries/DeliveryScreen";
import PastDeliveriesScreen from "./components/screens/deliveries/PastDeliveriesScreen";
import ViewAllDeliveriesScreen from "./components/screens/deliveries/ViewAllDeliveriesScreen";
import ProposalsScreen from "./components/screens/deliveries/ProposalsScreen";
import ProposalCheckScreen from "./components/screens/deliveries/ProposalCheckScreen";
import WeekDeliveryPredictionScreen from "./components/screens/deliveries/WeekDeliveryPredictionScreen";
import NewWeekDeliveryPrediction from "./components/screens/deliveries/NewWeekDeliveryPrediction";
import ViewWeekDeliveryPredictionScreen from "./components/screens/deliveries/ViewWeekDeliveryPredictionScreen"
import IncomingDeliveriesScreen from "./components/screens/deliveries/IncomingDeliveriesScreen";
import NewDelivery from "./components/screens/deliveries/NewDelivery";
import EditDelivery from "./components/screens/deliveries/EditDelivery";
import Permissions from 'react-native-permissions';
import strings from "./localization/strings";

interface State {
  authenticated: boolean
}
const initalStoreState: StoreState = {
};

const store = createStore<StoreState, AppAction, any, any>(reducer as any, initalStoreState);

const RootStack = createStackNavigator({
  Main: MainScreen,
  Login: LoginScreen,
  ChatsList: ChatsListScreen,
  Contracts: ContractsScreen,
  Contract: ContractScreen,
  ContractTerms: ContractTerms,
  News: NewsListScreen,
  NewsArticle: NewsArticleScreen,
  Deliveries: DeliveriesScreen,
  ViewAllDeliveries: ViewAllDeliveriesScreen,
  Delivery: DeliveryScreen,
  PastDeliveries: PastDeliveriesScreen,
  Proposals: ProposalsScreen,
  ProposalCheck: ProposalCheckScreen,
  WeekDeliveryPrediction: WeekDeliveryPredictionScreen,
  NewWeekDeliveryPrediction: NewWeekDeliveryPrediction,
  ViewWeekDeliveryPrediction: ViewWeekDeliveryPredictionScreen,
  IncomingDeliveries: IncomingDeliveriesScreen,
  NewDelivery: NewDelivery,
  EditDelivery: EditDelivery
}, {
    defaultNavigationOptions: {
      headerStyle: {
        backgroundColor: "#E51D2A",
        height: 70
      },
    },
    initialRouteName: "Login"
  });

const AppContainer = createAppContainer(RootStack);

export default class App extends React.Component<any, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      authenticated: false
    };

    Permissions.check('photo').then(response => {
      if (response !== "authorized") {
        Permissions.request('photo').then(response => {});
      }
    });

    Permissions.check('camera').then(response => {
      if (response !== "authorized") {
        Permissions.request('camera').then(response => {});
      }
    });
    strings.setLanguage("fi");
  }

  render() {
    return (
      <Root>
        <Provider store={store}>
          <MqttConnector>
            <AppContainer />
          </MqttConnector>
          <AuthRefresh />
        </Provider>
      </Root>
    );
  }
}