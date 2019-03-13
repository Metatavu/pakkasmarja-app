import React from "react";
import { Text, Input } from "native-base";
import { View, TouchableOpacity } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { AreaDetail, ItemGroup } from "pakkasmarja-client";
import { styles } from "./styles";
import { KeyboardType } from "../../../types";

/**
 * Interface for component props
 */
interface Props {
  itemGroup?: ItemGroup,
  areaDetails?: AreaDetail[],
  areaDetailValues: AreaDetail[],
  isActiveContract: boolean,
  onUserInputChange: (key: any, value: any) => void
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
          this.props.itemGroup && !this.props.itemGroup.minimumProfitEstimation &&
          <Col>
            <Text>Tuottoarvio (kg / ha)</Text>
          </Col>
        }
      </Row>
    );
  }

  /**
   * Render area details row
   * 
   * @param index index
   * @param name name
   * @param size size
   * @param species species
   */
  private renderAreaDetailsRow = (index: number, name?: string, size?: number, species?: string) => {
    const minimumEstimation = this.props.itemGroup ? this.props.itemGroup.minimumProfitEstimation : null;

    const style = {
      height: 40,
      borderColor: "red",
      backgroundColor: "white",
      borderWidth: 1,
      borderRadius: 4,
      marginTop: 10,
      textAlign: "center"
    }

    return (
      <Row key={index}>
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
   * 
   * @param index index
   * @param key key
   * @param editable editable
   * @param keyboardType keyboardType
   * @param value value
   * @param style style
   */
  private renderInputField = (index: number, key: string, editable: boolean, keyboardType: KeyboardType, value: string, style: any) => {
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
   * Component did mount life cycle method
   */
  public componentDidMount = () => {
    if (this.props.areaDetailValues.length <= 0) {
      this.createEmptyAreaDetail();
    }

    if (this.props.itemGroup && this.props.itemGroup.minimumProfitEstimation) {
      this.setState({ minimumProfit: this.props.itemGroup.minimumProfitEstimation });
    }
  }

  /**
   * Create empty area detail
   */
  private createEmptyAreaDetail = () => {
    const areaDetails: any = this.props.areaDetailValues;
    areaDetails.push({
      name: "",
      size: "",
      species: "",
      profitEstimation: ""
    });

    this.props.onUserInputChange("areaDetailValues", areaDetails);
  }

  /**
   * Render profit text
   */
  private renderProfitTextElements = () => {
    if (!this.props.itemGroup || this.props.areaDetailValues.length <= 0) {
      return;
    }

    const blocks = this.props.areaDetailValues.length;
    const minimumProfit = this.props.itemGroup.minimumProfitEstimation;

    const totalHectares = this.props.areaDetailValues.reduce((total, areaDetailValue) => {
      const size = areaDetailValue.size ? areaDetailValue.size : 0;
      return total += parseInt(size.toString(), 10);
    }, 0);

    const totalProfit = this.props.areaDetailValues.reduce((total, areaDetailValue) => {
      const estimation = minimumProfit || 0;
      const totalHectares = areaDetailValue.size ? areaDetailValue.size : 0;

      return total += estimation * totalHectares;
    }, 0);

    if (minimumProfit) {
      return (
        <View>
          <Text style={[styles.textWithSpace, styles.textSize]}>
            {`Lohkoja yhteensä ${blocks} kpl. Pinta-alaa yhteensä ${totalHectares} ha.`}
          </Text>
          <Text style={[{ color: totalProfit < minimumProfit ? "red" : "black" }, styles.textSize]}>
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
   * Handle input change
   * 
   * @param index index
   * @param key key
   * @param value value
   */
  private handleInputChange = (index: number, key: string, value: string | number) => {
    const areaDetails: any = this.props.areaDetailValues;

    if (areaDetails.length <= 0) {
      const areaDetail: any = {};
      areaDetail[key] = value;
      areaDetails.push(areaDetail);
      this.props.onUserInputChange("areaDetailValues", areaDetails);
    } else {
      areaDetails[index][key] = value;
      this.props.onUserInputChange("areaDetailValues", areaDetails);
    }
  }

  /**
   * Render method
   */
  public render() {
    return (
      <View>
        <View style={styles.BlueContentView}>
          <Text style={styles.ContentHeader}>TUOTANNOSSA OLEVAT HEHTAARIT</Text>
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
              <TouchableOpacity style={[styles.bigRedButton, {marginTop:25}]} onPress={this.createEmptyAreaDetail}>
                <Text style={styles.buttonText}>
                  LISÄÄ RIVI
                </Text>
              </TouchableOpacity>
          }
        </View>
        <View style={styles.WhiteContentView}>
          {
            this.renderProfitTextElements()
          }
        </View>
      </View>
    );
  }
}