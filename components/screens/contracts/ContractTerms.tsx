import React, { Dispatch } from "react";
import PakkasmarjaApi from "../../../api";
import { AccessToken, StoreState, ModalButton } from "../../../types";
import { Text, Spinner, CheckBox, ListItem, Body } from "native-base";
import { View, TextInput, Alert, TouchableHighlight, Platform } from "react-native";
import { SignAuthenticationService, Contract } from "pakkasmarja-client";
import * as actions from "../../../actions";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import Modal from "react-native-modal";
import { styles } from "./styles";
import Icon from "react-native-vector-icons/Feather";
import ModalSelector from 'react-native-modal-selector';
import AsyncButton from "../../generic/async-button";
import { Picker } from "native-base";
import WebView from "react-native-webview";
import { StackNavigationOptions } from '@react-navigation/stack';
import ProfileButton from "../../layout/ProfileButton";

/**
 * Interface for component props
 */
interface Props {
  navigation?: any;
  route: any;
  accessToken?: AccessToken;
};

/**
 * Interface for component state
 */
interface State {
  authServices?: SignAuthenticationService[],
  contract?: Contract,
  styles?: any,
  acceptedTerms: boolean,
  viableToSign: boolean,
  selectedSignServiceId: string,
  ssn: string,
  signAuthenticationUrl: string,
  modalOpen: boolean,
  type: string,
  loading: boolean
};

const redirectUrl = "about:blank";

/**
 * Contract terms component class
 */
class ContractTerms extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      acceptedTerms: false,
      viableToSign: false,
      selectedSignServiceId: "0",
      ssn: "",
      signAuthenticationUrl: "",
      modalOpen: false,
      type: "2020",
      loading: false
    };
  }

  /**
   * Component did mount
   */
  public componentDidMount = async () => {
    const { accessToken, navigation, route } = this.props;
    navigation.setOptions(this.navigationOptions(this.props.navigation));
    const { contract } = route.params;

    if (!accessToken) {
      return;
    }

    if (contract) {
      this.setState({ contract: contract });
    }

    const signAuthenticationServices = await new PakkasmarjaApi()
      .getSignAuthenticationServicesService(accessToken.access_token)
      .listSignAuthenticationServices();

    this.setState({ authServices: signAuthenticationServices });
  }

  /**
   * Accept contract
   */
  private signContractClicked = async () => {
    const { accessToken } = this.props;
    const {
      contract,
      acceptedTerms,
      viableToSign,
      ssn,
      type,
      selectedSignServiceId
    } = this.state;

    if (!accessToken || !contract) {
      return;
    }

    if (!acceptedTerms) {
      const header = "Allekirjoitus epäonnistui";
      const content = "Sinun tulee hyväksyä sopimusehdot ennen allekirjotusta.";
      const buttons = [{ text: 'OK', onPress: () => { } }];
      this.displayAlert(header, content, buttons);
      return;
    }

    if (!viableToSign) {
      const header = "Allekirjoitus epäonnistui";
      const content = "Sinun tulee olla viljelijän puolesta edustuskelpoinen.";
      const buttons = [{ text: 'OK', onPress: () => { } }];
      this.displayAlert(header, content, buttons);
      return;
    }

    if (!ssn) {
      const header = "Allekirjoitus epäonnistui";
      const content = "Sinun tulee antaa henkilötunnus.";
      const buttons = [{ text: 'OK', onPress: () => { } }];
      this.displayAlert(header, content, buttons);
      return;
    }

    this.setState({ loading: true });

    const contractSignRequest = await new PakkasmarjaApi()
      .getContractsService(accessToken.access_token)
      .createContractDocumentSignRequest({ redirectUrl: "" }, contract.id || "", type, ssn, selectedSignServiceId, redirectUrl);

    if (contractSignRequest && contractSignRequest.redirectUrl) {
      this.setState({ loading: false, signAuthenticationUrl: contractSignRequest.redirectUrl, modalOpen: true });
    } else {
      const header = "Allekirjoitus epäonnistui";
      const content = "Jotain meni pieleen. Varmista, että olet valinnut tunnistautumispalvelun ja henkilötunnus on oikeassa muodossa.";
      const buttons = [{ text: 'OK', onPress: () => { } }];
      this.displayAlert(header, content, buttons);
      return;
    }
  }

  /**
   * Display alert
   *
   * @param header header
   * @param content content
   * @param buttons buttons
   */
  private displayAlert = (header: string, content: string, buttons: ModalButton[]) => {
    Alert.alert(
      header,
      content,
      buttons
    );
  }

  /**
   * When signed successfully
   */
  private onSignSuccess = async () => {
    this.setState(
      { modalOpen: false },
      () => this.props.navigation.navigate('Contracts', { refresh: true })
    );
  }

  /**
   * Accept contract
   */
  private backButtonClicked = async () => {
    this.props.navigation.goBack();
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
      headerTitle: () => <TopBar/>,
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableHighlight onPress={ navigation.goBack }>
          <Icon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
      ),
      headerRight: () => <ProfileButton/>
    }
  };

  /**
   * Render method for contract modal component
   */
  public render() {
    const { navigation } = this.props;
    const {
      loading,
      contract,
      acceptedTerms,
      viableToSign,
      selectedSignServiceId,
      authServices,
      ssn,
      modalOpen
    } = this.state;

    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Spinner color="red" />
        </View>
      );
    }

    return (
      <BasicScrollLayout navigation={ navigation } backgroundColor="#fff" displayFooter>
        <View style={ styles.WhiteContentView }>
          <View>
            <Text style={ styles.ContentHeader }>
              Sopimus
            </Text>
            <Text style={ styles.Text }>
              { `Satokautta ${contract?.year || ""} koskeva sopimus` }
            </Text>
          </View>
          <View>
            <ListItem>
              <CheckBox
                color="#E51D2A"
                checked={ acceptedTerms }
                onPress={ () => this.setState({ acceptedTerms: !acceptedTerms }) }
              />
              <Body>
                <Text>Olen lukenut ja hyväksyn sopimusehdot</Text>
              </Body>
            </ListItem>
            <ListItem>
              <CheckBox
                color="#E51D2A"
                checked={ viableToSign }
                onPress={() => this.setState({ viableToSign: !this.state.viableToSign })}
              />
              <Body>
                <Text>Olen viljelijän puolesta edustuskelpoinen</Text>
              </Body>
            </ListItem>
          </View>
          <View>
            <Text style={[ styles.Text, styles.TextBold ]}>Tunnistautumispalvelu:</Text>
            <View style={{ ...styles.InputStyle, height: Platform.OS === "ios" ? 40 : 50 }}>
              { Platform.OS !== "ios" &&
                <Picker
                  selectedValue={ selectedSignServiceId }
                  style={{ height: 50, width: "100%", color: "black" }}
                  onValueChange={ (itemValue: string) => this.setState({ selectedSignServiceId: itemValue }) }>
                  {
                    authServices?.map((authService) => (
                      <Picker.Item
                        key={ authService.identifier }
                        label={ authService.name || "" }
                        value={ authService.identifier }
                      />
                    ))
                  }
                </Picker>
              }
              {
                Platform.OS === "ios" &&
                <ModalSelector
                  data={
                    authServices?.map(authService => ({
                      key: authService.identifier,
                      label: authService.name
                    })) || []
                  }
                  selectedKey={ selectedSignServiceId }
                  initValue="Valitse tunnistautumispalvelu"
                  onChange={ (option: any) => this.setState({ selectedSignServiceId: option.key }) }
                />
              }
            </View>
          </View>
          <View>
            <Text style={[ styles.Text, styles.TextBold ]}>Henkilötunnus:</Text>
            <TextInput
              style={ styles.InputStyle }
              value={ ssn }
              onChangeText={ (text: string) => this.setState({ ssn: text }) }
            />
          </View>
          <View style={ styles.flexView }>
            <AsyncButton style={ styles.smallRedButton } onPress={ this.backButtonClicked }>
              <Text style={ styles.buttonText }>
                TAKAISIN
              </Text>
            </AsyncButton>
            <AsyncButton style={ styles.smallRedButton } onPress={ this.signContractClicked }>
              <Text style={ styles.buttonText }>
                ALLEKIRJOITA
              </Text>
            </AsyncButton>
          </View>
        </View>
        <Modal isVisible={ modalOpen } style={{ height: "100%", width: "100%" }}>
          <WebView
            source={{ uri: this.state.signAuthenticationUrl }}
            style={{ width: "90%", height: "100%" }}
            scalesPageToFit={ false }
            onNavigationStateChange={ (webViewState: any) => webViewState.url === redirectUrl && this.onSignSuccess() }
          />
        </Modal>
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractTerms);