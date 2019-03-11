import React from "react";
import { Text, List, ListItem, Input } from "native-base";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { AreaDetail, ItemGroup } from "pakkasmarja-client";
import { any } from "prop-types";

/**
 * Interface for component props
 */
interface Props {
  itemGroup?: ItemGroup,
  areaDetails?: AreaDetail[],
  areaDetailValues: AreaDetail[],
  isActiveContract: boolean,
  onUserInputChange: (key:any, value:any) => void,
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  minimumProfit: number
};

export default class ContractAreaDetails extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      minimumProfit: 0
    };
  }

  /**
   * Render area detail headers
   */
  private renderAreaDetailHeaders = () => {
    return (
      <Row>
        <Col>
          <Text>Lohko/Lohkot</Text>
        </Col>
        <Col>
          <Text>Pinta-ala (ha)</Text>
        </Col>
        <Col>
          <Text>Lajike/Lajikkeet</Text>
        </Col>
        {
          this.props.itemGroup && this.props.itemGroup.minimumProfitEstimation &&
          <Col>
            <Text>Tuottoarvio (kg / ha)</Text>
          </Col>
        }
      </Row>
    );
  }

  /**
   * Get area details row
   */
  private renderAreaDetailsRow = (index: number, name?: string, size?: number, species?: string) => {
    const minimumEstimation = this.props.itemGroup ? this.props.itemGroup.minimumProfitEstimation : null;

    const style = {
      height:40,
      borderColor: "red",
      backgroundColor:"white",
      borderWidth: 3,
      borderRadius: 18,
      marginTop: 10,
      textAlignVertical: "center"
    }
    
    return (
      <Row>
        <Col>
          {this.renderInputField(index, "name", !this.props.isActiveContract, "default", name || "", style)}
        </Col>
        <Col>
          {this.renderInputField(index, "size", !this.props.isActiveContract, "numeric", size && size.toString() || "", style)}
        </Col>
        <Col>
          {this.renderInputField(index, "species", !this.props.isActiveContract, "default", species || "", style)}
        </Col>
        {
          !minimumEstimation &&
            <Col>
              {this.renderInputField(index, "profitEstimation", !this.props.isActiveContract, "numeric", "0", style)}
            </Col>
        }
      </Row>
    );
  }

  /**
   * Render input field
   */
  private renderInputField = (index: number, key: string, editable: boolean, keyboardType: any, value: string, style: any) => {
    return (
      <Input
        key={index}
        style={style}
        editable={editable}
        keyboardType={keyboardType}
        value={value}
        onChangeText={(text: any) => this.handleInputChange(index, key, text)}
      />
    );
  }

  /**
   * Component did mount
   */
  public componentDidMount = () => {
    if (this.props.areaDetailValues.length <= 0) {
      this.createEmptyAreaDetail();
    }

    if (this.props.itemGroup && this.props.itemGroup.minimumProfitEstimation) {
      this.setState({ minimumProfit: this.props.itemGroup.minimumProfitEstimation});
    }
  }

  /**
   * Updates profit text
   */
  private renderProfitTextElements = () => {
    if (!this.props.itemGroup || this.props.areaDetailValues.length <= 0) {
      return;
    }

    const blocks = this.props.areaDetailValues.length;
    const proposedAmount = this.props.itemGroup.minimumProfitEstimation;

    const totalHectares = this.props.areaDetailValues.reduce((total, areaDetailValue) => {
      const size = areaDetailValue.size ? areaDetailValue.size : 0;
      return total += parseInt(size.toString(), 10);
    }, 0);

    const totalProfit = this.props.areaDetailValues.reduce((total, areaDetailValue) => {
      const estimation = proposedAmount || 0;
      const totalHectares = areaDetailValue.size ? areaDetailValue.size : 0;

      return total += estimation * totalHectares;
    }, 0);

    if (proposedAmount) {
      const errorStyle = totalProfit < proposedAmount ? {color: "red"} : {};
      return (
        <View>
          <Text>
            {`Lohkoja yhteensä ${blocks} kpl. Pinta-alaa yhteensä ${totalHectares} ha.`}
          </Text>
          <Text style={{color: totalProfit < proposedAmount ? "red": "black"}}>
            {`Minimisopimusmäärä on ${totalProfit} kg, perustuen hehtaarikohtaiseen toimitusmääräminimiin 500 kg / ha. Lisätietoja sopimuksen kohdasta Sopimuksen mukaiset toimitusmäärät, takuuhinnat ja bonus satokaudella ${(new Date()).getFullYear()}`}
          </Text>
        </View>
      );
    } else {
      return (
        <Text>
          {`Lohkoja yhteensä ${blocks} kpl. Pinta-alaa yhteensä ${totalHectares} ha. Tuotantoarvio yhteensä ${totalProfit} kg`}
        </Text>
      );
    }
  }

  /**
   * Create empty area detail
   */
  createEmptyAreaDetail = () => {
    const areaDetails: any = this.props.areaDetailValues;
    areaDetails.push({
      name: "",
      size: "",
      species: ""
    });

    this.props.onUserInputChange("areaDetailValues", areaDetails);
  }

  /**
   * Handle input change
   */
  private handleInputChange = (index: number, key: string, value: any) => {
    const areaDetails: any = this.props.areaDetailValues;

    if (areaDetails.length <= 0) {
      let areaDetail: any = {};
      areaDetail[key] = value;
      areaDetails.push(areaDetail);
      this.props.onUserInputChange("areaDetailValues", areaDetails);
    } else {
      areaDetails[index][key] = value;
      this.props.onUserInputChange("areaDetailValues", areaDetails);
    }
  }

  public render() {
    return (
      <View style={this.props.styles.BlueContentView}>
        <Text style={this.props.styles.ContentHeader}>Tuotannossa olevat hehtaarit</Text>
        <Grid>
          {
            this.renderAreaDetailHeaders()
          }
          {
            this.props.areaDetailValues && this.props.areaDetailValues.length > 0 && this.props.areaDetailValues.map((areaDetail, index) => {
              return (
                this.renderAreaDetailsRow(index, areaDetail.name, areaDetail.size, areaDetail.species)
              );
            })
          }
        </Grid>
        {
          !this.props.isActiveContract && 
          <TouchableOpacity onPress={this.createEmptyAreaDetail}>
            <Text style={{ backgroundColor: "red"}}>
              Lisää rivi
            </Text>
          </TouchableOpacity>
        }
        {
          this.renderProfitTextElements()
        }
      </View>
    );
  }
}