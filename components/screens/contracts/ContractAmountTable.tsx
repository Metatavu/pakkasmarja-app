import React from "react";
import TopBar from "../../layout/TopBar";
import { Text } from "native-base";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { Contract } from "pakkasmarja-client";

/**
 * Component props
 */
interface Props {
  contracts: Contract[];
  onContractClick: (contract: Contract) => void;
  type: string;
  onProposeNewContractClick: (type: string) => void;
};

/**
 * Component state
 */
interface State {
};

export default class ContractAmountTable extends React.Component<Props, State> {

  /**
   * Constructor 
   * 
   * @param props 
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      tableData: []
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
      headerRow:{
        paddingBottom: 5, 
        marginBottom:20,
        borderBottomColor: "#000000", 
        borderBottomWidth: 1
      },
      row:{
        paddingBottom: 12, 
        paddingTop: 12, 
      }
    });
    return (
      <View>
        <View style={styles.BlueContentView}>
          <Grid style={{ padding: 10 }}>
            <Row style={styles.headerRow}>
              <Col></Col>
              <Col><Text>Sovittu KG</Text></Col>
              <Col><Text>Toteutunut KG</Text></Col>
            </Row>
            {this.props.contracts.filter(contract => contract.status !== "TERMINATED").map((contract) => {
              return (
                <TouchableOpacity key={contract.id} onPress={() => { this.props.onContractClick(contract) }}>
                  <Row style={styles.row}>
                    <Col><Text style={{ fontSize: 20, fontWeight:"bold" }}>Mustikka</Text></Col>
                    <Col><Text style={{ fontSize: 20 }}>{contract.contractQuantity}</Text></Col>
                    <Col><Text style={{ fontSize: 20 }}>{contract.deliveredQuantity}</Text></Col>
                  </Row>
                </TouchableOpacity>
              );
            })}
          </Grid>
        </View>
        <TouchableOpacity onPress={() => this.props.onProposeNewContractClick(this.props.type)}>
            <Text>
              {
                this.props.type === "FROZEN" ? "Ehdota uutta pakastesopimusta" : "Ehdota uutta tuoresopimusta"
              }
            </Text>
          </TouchableOpacity>
      </View>
    );
  }
}

