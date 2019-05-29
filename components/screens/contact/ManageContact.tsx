import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { View, Alert, TextInput, TouchableOpacity, ScrollView, TouchableHighlight, Picker, Platform } from "react-native";
import { StoreState, AccessToken, ManageContactKey, ManageContactInput } from "../../../types";
import * as actions from "../../../actions";
import PakkasmarjaApi from "../../../api";
import { Address, Contact } from "pakkasmarja-client";
import { Text } from "react-native-elements";
import { styles } from "../deliveries/styles.tsx";
import TopBar from "../../layout/TopBar";
import FeatherIcon from "react-native-vector-icons/Feather";
import ModalSelector from 'react-native-modal-selector';
import { Icon } from "native-base";

/**
 * Component props
 */
interface Props {
  accessToken?: AccessToken
  navigation?: any
}

/**
 * Component state
 */
interface State {
  loading: boolean;
  usersContact?: Contact;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber1: string;
  phoneNumber2: string;
  email: string;
  audit: string;
  sapId: string;
  addresses?: Array<Address>;
  BIC: string;
  IBAN: string;
  taxCode: string;
  vatLiable?: Contact.VatLiableEnum;
  alv: string;
  postNumber: string;
  postAddress: string;
  city: string;
  farmPostNumber: string;
  farmPostAddress: string;
  farmCity: string;
}

/**
 * Manage contact component
 */
class ManageContact extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      firstName: '',
      lastName: '',
      companyName: '',
      phoneNumber1: '',
      phoneNumber2: '',
      email: '',
      audit: '',
      sapId: '',
      BIC: '',
      IBAN: '',
      taxCode: '',
      alv: '',
      postNumber: '',
      postAddress: '',
      city: '',
      farmPostNumber: '',
      farmPostAddress: '',
      farmCity: ''
    };
  }

  /**
   * Navigation options property
   */
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
  public componentDidMount = async () => {
    const { accessToken } = this.props;
    if (!accessToken || !accessToken.access_token || !accessToken.userId) {
      return;
    }
    this.setState({ loading: true });
    const api = new PakkasmarjaApi();
    const usersContact = await api.getContactsService(accessToken.access_token).findContact(accessToken.userId);
    this.setState({
      loading: false,
      firstName: usersContact.firstName || '',
      lastName: usersContact.lastName || '',
      companyName: usersContact.companyName || '',
      email: usersContact.email || '',
      audit: usersContact.audit || '',
      sapId: usersContact.sapId || '',
      BIC: usersContact.BIC || '',
      IBAN: usersContact.IBAN || '',
      taxCode: usersContact.taxCode || '',
      alv: usersContact.taxCode || '',
      vatLiable: usersContact.vatLiable || undefined
    });
    if (usersContact.phoneNumbers) {
      if (usersContact.phoneNumbers[0]) {
        this.setState({
          phoneNumber1: usersContact.phoneNumbers[0]
        });
      }
      if (usersContact.phoneNumbers[1]) {
        this.setState({
          phoneNumber2: usersContact.phoneNumbers[1]
        });
      }
    }
    if (usersContact.addresses) {
      if (usersContact.addresses[0]) {
        this.setState({
          postNumber: usersContact.addresses[0].postalCode || '',
          postAddress: usersContact.addresses[0].streetAddress || '',
          city: usersContact.addresses[0].city || '',
        });
      }
      if (usersContact.addresses[1]) {
        this.setState({
          farmPostNumber: usersContact.addresses[1].postalCode || '',
          farmPostAddress: usersContact.addresses[1].streetAddress || '',
          farmCity: usersContact.addresses[1].city || ''
        });
      }
    }
  }

  /**
   * Component render method
   */
  public render() {

    const basicInfoInputs: ManageContactInput[] = [
      {
        label: "Etunimi",
        key: "firstName"
      },
      {
        label: "Sukunimi",
        key: "lastName"
      },
      {
        label: "Yritys",
        key: "companyName"
      },
      {
        label: "Puhelin 1",
        key: "phoneNumber1"
      },
      {
        label: "Puhelin 2",
        key: "phoneNumber2"
      },
      {
        label: "Sähköposti",
        key: "email"
      },
      {
        label: "Auditoitu",
        key: "audit"
      },
      {
        label: "Viljelijänumero",
        key: "sapId",
        isDisabled: true
      }
    ];

    const addressInfoInputs: ManageContactInput[] = [
      {
        label: "Postinro",
        key: "postNumber"
      },
      {
        label: "Postiosoite",
        key: "postAddress"
      },
      {
        label: "Kaupunki",
        key: "city"
      },
      {
        label: "Tilan postinro",
        key: "farmPostNumber"
      },
      {
        label: "Tilan osoite",
        key: "farmPostAddress"
      },
      {
        label: "Tilan kaupunki",
        key: "farmCity"
      }
    ];

    const bankInfoInputs: ManageContactInput[] = [
      {
        label: "BIC",
        key: "BIC"
      },
      {
        label: "Tilinumero (IBAN)",
        key: "IBAN"
      },
      {
        label: "ALV - tunnus",
        key: "alv"
      }
    ];

    const vatLiableOptions: { key: string, value: Contact.VatLiableEnum | undefined, text: string }[] = [{
      key: "undefined",
      value: undefined,
      text: "Valitse..."
    }, {
      key: "true",
      value: "true",
      text: "Kyllä"
    }, {
      key: "false",
      value: "false",
      text: "Ei"
    }, {
      key: "Eu",
      value: "EU",
      text: "EU"
    }];

    return (
      <ScrollView>
        <View style={[styles.center, styles.topViewWithButton]}>
          <View style={[styles.center, { flexDirection: "row", paddingVertical: 30 }]}>
            <Icon style={{ fontSize: 30, color: '#E51D2A', marginRight: 15 }} type="FontAwesome" name="user" />
            <Text style={{ color: "black", fontWeight: "700", fontSize: 24 }}>Perustiedot</Text>
          </View>
        </View>
        <View style={{ padding: 15 }}>
          {

            basicInfoInputs.map((input) => {
              return this.renderInput(input.label, input.key, input.isDisabled);
            })
          }
        </View>
        <View style={[styles.center, styles.topViewWithButton]}>
          <View style={[styles.center, { flexDirection: "row", paddingVertical: 30 }]}>
            <Icon style={{ fontSize: 30, color: '#E51D2A', marginRight: 15 }} type="FontAwesome" name="address-book" />
            <Text style={{ color: "black", fontWeight: "700", fontSize: 24 }}>Osoitetiedot</Text>
          </View>
        </View>
        <View style={{ padding: 15 }}>
          {
            addressInfoInputs.map((input) => {
              return this.renderInput(input.label, input.key);
            })
          }
        </View>
        <View style={[styles.center, styles.topViewWithButton]}>
          <View style={[styles.center, { flexDirection: "row", paddingVertical: 30 }]}>
            <Icon style={{ fontSize: 30, color: '#E51D2A', marginRight: 15 }} type="FontAwesome" name="university" />
            <Text style={{ color: "black", fontWeight: "700", fontSize: 24 }}>Pankkitiedot</Text>
          </View>
        </View>
        <View style={{ padding: 15 }}>
          {
            bankInfoInputs.map((input) => {
              return this.renderInput(input.label, input.key);
            })
          }

          <View style={{ flex: 1, flexDirection: "column", height: 80, marginBottom: 10 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16, color: "black", paddingBottom: 5 }}>ALV. velvollisuus</Text>
            <View style={{
              height: Platform.OS === "ios" ? 40 : 50,
              width: "100%",
              backgroundColor: 'white',
              borderColor: "red",
              borderWidth: 1,
              borderRadius: 4
            }}>
              {Platform.OS !== "ios" &&
                <Picker
                  selectedValue={this.state.vatLiable}
                  style={{ height: 50, width: "100%", color: "black" }}
                  onValueChange={(itemValue, itemIndex) =>
                    this.handleInputChange("vatLiable", itemValue)
                  }>
                  {
                    vatLiableOptions.map((option) => {
                      return (
                        <Picker.Item key={option.key} label={option.text} value={option.value} />
                      );
                    })
                  }
                </Picker>
              }
              {
                Platform.OS === "ios" &&
                <ModalSelector
                  data={vatLiableOptions.map((option) => {
                    return {
                      key: option.key,
                      label: option.text
                    };
                  })}
                  selectedKey={this.state.vatLiable}
                  onChange={(option: any) => { this.handleInputChange("vatLiable", option.key) }} />
              }
            </View>
          </View>
          <View style={[styles.center, { flex: 1 }]}>
            <TouchableOpacity style={[styles.deliveriesButton, styles.center, { width: "50%", height: 60, marginTop: 15 }]} onPress={this.handleSave}>
              <Text style={styles.buttonText}>Tallenna</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  /**
   * Handle inputchange
   * 
   * @param key key
   * @param value value
   */
  private handleInputChange = (key: ManageContactKey, value: string) => {
    const state: State = this.state;
    state[key] = value;
    this.setState(state);
  }

  /**
   * Render input
   * 
   * @param label inputs label
   * @param key needs to be the same key with state
   * @param isEditable optional
   */
  private renderInput = (label: string, key: ManageContactKey, isEditable?: boolean) => {
    return (
      <View key={label} style={{ flex: 1, flexDirection: "column", height: 80, marginBottom: 10 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16, color: "black", paddingBottom: 5 }}>{label}</Text>
        <TextInput
          editable={!isEditable}
          style={{ borderRadius: 4, borderWidth: 1, borderColor: "red" }}
          onChangeText={(value) => this.handleInputChange(key, value)}
          value={this.state[key]}
        />
      </View>
    )
  }

  /**
   * Handles save click
   */
  private handleSave = async () => {
    const { accessToken } = this.props;
    if (!accessToken || !accessToken.access_token || !accessToken.userId) {
      return
    }
    const api = new PakkasmarjaApi();
    const contactService = await api.getContactsService(accessToken.access_token);
    const { firstName, lastName, companyName, email, BIC, IBAN, taxCode, audit, phoneNumber1, sapId,
      phoneNumber2, postNumber, postAddress, city, farmPostNumber, farmPostAddress, farmCity, vatLiable } = this.state;

    const phoneNumbers: string[] = [
      phoneNumber1 || "",
      phoneNumber2 || "",
    ];

    const addresses: Address[] = [
      {
        streetAddress: postAddress,
        postalCode: postNumber,
        city: city
      }, {
        streetAddress: farmPostAddress,
        postalCode: farmPostNumber,
        city: farmCity
      }];

    const newContact: Contact = {
      sapId: sapId || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      companyName: companyName || undefined,
      phoneNumbers: phoneNumbers[0] || phoneNumbers[1] ? phoneNumbers : [],
      email: email || undefined,
      BIC: BIC || undefined,
      IBAN: IBAN || undefined,
      taxCode: taxCode || undefined,
      audit: audit || undefined,
      vatLiable: vatLiable || undefined,
      addresses: addresses[0] || addresses[1] ? addresses : []
    };

    contactService.updateContact(newContact, accessToken.userId).then((updatedData) => {
      Alert.alert(
        'Onnistui!',
        `Tietojen päivittäminen onnistui.`,
        [
          { text: 'OK', onPress: () => this.props.navigation.goBack() }
        ]
      );
    }).catch((err) => {
      Alert.alert(
        'Virhe!',
        `Tietojen tallentamisessa tapahtui virhe, yritä myöhemmin uudelleen.`,
        [
          { text: 'OK', onPress: () => this.props.navigation.goBack() }
        ]
      );
    });
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
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageContact);
