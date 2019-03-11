import { createStackNavigator, createAppContainer } from "react-navigation";
import React from "react";
import LoginScreen from "./components/screens/LoginScreen";
import MainScreen from "./components/screens/MainScreen";
import ContractsScreen from "./components/screens/contracts/ContractsScreen";
import ContractScreen from "./components/screens/contracts/ContractScreen";
import { createStore } from 'redux';
import { StoreState } from "./types";
import { AppAction } from "./actions";
import { reducer } from "./reducers";
import { Provider } from "react-redux";
import AuthRefresh from "./components/AuthRefresh";
import MqttConnector from "./components/MqttConnector";

interface State {
  authenticated: boolean
}
const initalStoreState: StoreState = {
};

const store = createStore<StoreState, AppAction, any, any>(reducer as any, initalStoreState);

const RootStack = createStackNavigator({
  Main: MainScreen,
  Login: LoginScreen,
  Contracts: ContractsScreen,
  Contract: ContractScreen
}, {
  defaultNavigationOptions: {
    headerStyle: {
      backgroundColor: "#E51D2A",
      height: 100
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
  }

  render() {
    return (
      <Provider store={store}>
        <MqttConnector>
          <AppContainer />
        </MqttConnector>
        <AuthRefresh />
      </Provider>
    );
  }
}