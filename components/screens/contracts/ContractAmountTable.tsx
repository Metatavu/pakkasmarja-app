import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import { Text } from "native-base";
import { View, TouchableOpacity, TouchableHighlight } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { Contract, ItemGroup } from "pakkasmarja-client";
import { AccessToken, StoreState, ContractTableData } from "../../../types";
import { connect } from "react-redux";
import * as actions from "../../../actions";
import { styles } from "./styles";
import FeatherIcon from "react-native-vector-icons/Feather";
import _ from "lodash";
import { Icon } from "native-base";

/**
 * Component props
 */
interface Props {
  contractTableDatas: ContractTableData[];
  onContractClick: (contract: Contract) => void;
  type: string;
  onProposeNewContractClick: (type: string) => void;
  accessToken?: AccessToken;
};

/**
 * Component state
 */
interface State {
};

/**
 * Contract amount table component class
 */
class ContractAmountTable extends React.Component<Props, State> {

  /**
   * Constructor 
   * 
   * @param props 
   */
  constructor(props: Props) {
    super(props);
    this.state = {
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
          <FeatherIcon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
    }
  };

  /**
   * Render rows
   */
  private renderRows = () => {
    const contractsNotTerminated: ContractTableData[] = this.props.contractTableDatas.filter(contractTableData => contractTableData.contract.status !== "TERMINATED");
    const sortedContracts = _.sortBy(contractsNotTerminated, (obj) => obj.contract.status);
    return sortedContracts.map((contractTableData) => {
      const contractStatus = contractTableData.contract.status;
      return (
        <TouchableOpacity key={contractTableData.contract.id} onPress={() => { this.props.onContractClick(contractTableData.contract) }}>
          {
            contractStatus !== "APPROVED" ?
              this.renderNotApproved(contractStatus, contractTableData.itemGroup) :
              this.renderApproved(contractTableData.contract, contractTableData.itemGroup)
          }
        </TouchableOpacity>
      );
    });
  }

  /**
   * Render not apporoved row
   * 
   * @param contract contract
   * @param itemGroup itemGroup
   */
  private renderApproved = (contract: Contract, itemGroup?: ItemGroup) => {
    if (!contract || !contract.contractQuantity) {
      return <Row></Row>;
    }

    return (
      <Row style={[styles.row, { borderBottomColor: "black", borderBottomWidth: 0.5, height: 75 }]}>
        {this.renderColumn(itemGroup && itemGroup.displayName ? itemGroup.displayName : "-")}
        {this.renderColumn(contract.contractQuantity.toString(), { fontWeight: "bold", fontSize: 18 })}
        {this.renderColumn(contract.deliveredQuantity ? contract.deliveredQuantity.toString() : "0", { fontWeight: "bold", fontSize: 18 })}
      </Row>
    );
  }

  /**
   * Render not apporoved row
   * 
   * @param status status
   * @param itemGroup itemGroup
   */
  private renderNotApproved = (status: string, itemGroup?: ItemGroup) => {
    const info: { text: string, icon: string } = this.getInfo(status);

    return (
      <Row style={[styles.row, { borderBottomColor: "black", borderBottomWidth: 0.5, height: 75 }]}>
        {this.renderColumn(itemGroup && itemGroup.displayName ? itemGroup.displayName : "-", { fontSize: 15 })}
        {this.renderColumn(info.text, { fontSize: 15 }, info.icon)}
      </Row>
    );
  }

  /**
   * Get info text by status
   * 
   * @param status status
   * @return info text
   */
  private getInfo = (status: string): { text: string, icon: string } => {
    switch (status) {
      case "ON_HOLD":
        return { text: "Odottaa", icon: "clock-o" };
      case "DRAFT":
        return { text: "Tarkasta ehdotus", icon: "envelope" };
      case "REJECTED":
        return { text: "Hylätty", icon: "close" };
      default:
        return { text: "", icon: "" };
    }
  }

  /**
   * Render column
   * 
   * @param text
   * @style style
   */
  private renderColumn = (text: string, style?: any, icon?: string) => {
    return (
      <Col style={[style, { flex: 1, justifyContent: "center", alignItems: "center", flexDirection: "row" }]}>
        {icon &&
          <Icon style={{ color: '#E51D2A', fontSize: 20, marginRight: 10 }} type="FontAwesome" name={icon} />
        }
        <Text style={[{ fontSize: 15, textAlign: "center" }, style]}>
          {text}
        </Text>
      </Col>
    );
  }

  /**
   * Render method
   */
  public render() {
    return (
      <View>
        <View style={styles.BlueContentView}>
          <Grid>
            <Row style={styles.headerRow}>
              <Col></Col>
              <Col><Text style={{textAlign:"center"}}>Sovittu KG</Text></Col>
              <Col><Text style={{textAlign:"center"}}>Toteutunut KG</Text></Col>
            </Row>
            {this.renderRows()}
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

