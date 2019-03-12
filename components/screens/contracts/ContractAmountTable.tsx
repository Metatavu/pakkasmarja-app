import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import { Text } from "native-base";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { Contract, ItemGroup } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import { AccessToken, StoreState } from "../../../types";
import { connect } from "react-redux";
import * as actions from "../../../actions";
import { REACT_APP_API_URL } from 'react-native-dotenv';



/**
 * 
 */
interface ContractItemGroup{
  contract: Contract;
  itemgroup: ItemGroup | undefined;
}
/**
 * Component props
 */
interface Props {
  contracts: Contract[];
  onContractClick: (contract: Contract) => void;
  type: string;
  onProposeNewContractClick: (type: string) => void;
  accessToken?: AccessToken;
};

/**
 * Component state
 */
interface State {
  ContractItemGroups: ContractItemGroup[]
};

class ContractAmountTable extends React.Component<Props, State> {

  /**
   * Constructor 
   * 
   * @param props 
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      ContractItemGroups: []
    };
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
      secondaryNavItems={[{
        "text": "Secondary 1",
        "link": "/secondary"
      }, {
        "text": "Secondary 2",
        "link": "/secondary"
      }, {
        "text": "Secondary 3",
        "link": "/secondary"
      }]}
    />
  };

  /**
   * On propose new contract click
   */
  proposeNewContractClick = () => {

  }
    /**
   * Get item group 
   * 
   * @param itemGroupId itemGroupId
   */
  private getItemGroup = async (itemGroupId: any) => {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const itemGroupService = api.getItemGroupsService(this.props.accessToken.access_token);
    return await itemGroupService.findItemGroup(itemGroupId);
  }
  
  async componentDidMount() {
    
    const tabledata : ContractItemGroup[]  = [];
    this.props.contracts.forEach(async(contract)=>{
        const itemgroup = await this.getItemGroup(contract.itemGroupId);
        const temp = {contract: contract, itemgroup: itemgroup}
        tabledata.push(temp)
    });

    this.setState({ContractItemGroups: tabledata})

    console.log(this.state.ContractItemGroups);
  }

  tableDisplay(status: string) {
    switch (status) {
      case 'DRAFT':
        return (<Text>Tarkasta ehdotus</Text>);
      case 'ON_HOLD':
        return (<Text>Pakkasmarjan tarkistettavana</Text>);
      case 'REJECTED':
        return (<Text>Hylätty</Text>);
      default:
        return (<Text>Sopimus käsittelyssä</Text>);

    }
  }

  /**
   * Render method
   */
  public render() {
    const styles = StyleSheet.create({
      BlueContentView: {
        padding: 15,
        backgroundColor: "#dae7fa",
        paddingBottom: 20,
        marginBottom: 15
      },
      WhiteContentView: {
        padding: 15,
        paddingBottom: 20,
      },
      headerRow: {
        paddingBottom: 5,
        marginBottom: 20,
        borderBottomColor: "#000000",
        borderBottomWidth: 1
      },
      row: {
        paddingBottom: 12,
        paddingTop: 12,
      },
      bigRedButton: {
        width: "100%",
        height: 45,
        backgroundColor: "#e01e36",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10
      },
      buttonText: {
        color: "white",
        fontSize: 22,
        fontWeight: "500"
      }
    });
    return (
      <View>
        <View style={styles.BlueContentView}>
          <Grid>
            <Row style={styles.headerRow}>
              <Col></Col>
              <Col><Text>Sovittu KG</Text></Col>
              <Col><Text>Toteutunut KG</Text></Col>
            </Row>
            {
              this.props.contracts.filter(contract => contract.status !== "TERMINATED").map((contract) => {

                return (
                  <TouchableOpacity key={contract.id} onPress={() => { this.props.onContractClick(contract) }}>
                    <Row style={styles.row}>
                      <Col><Text style={{ fontSize: 20, fontWeight: "bold" }}>Mustikka</Text></Col>
                      <Col>{this.tableDisplay(contract.status)}</Col>
                      
                      {
                        /*<Col><Text style={{ fontSize: 20 }}>{contract.contractQuantity}</Text></Col>
                        <Col><Text style={{ fontSize: 20 }}>{contract.deliveredQuantity}</Text></Col> */
                      }
                      <Col></Col>
                    </Row>
                  </TouchableOpacity>
                );
              })}
          </Grid>
        </View>
        <View style={styles.WhiteContentView}>
          <TouchableOpacity style={styles.bigRedButton} onPress={() => this.props.onProposeNewContractClick(this.props.type)}>
            <Text style={styles.buttonText}>
              {
                this.props.type === "FROZEN" ? "Ehdota uutta pakastesopimusta" : "Ehdota uutta tuoresopimusta"
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractAmountTable);

