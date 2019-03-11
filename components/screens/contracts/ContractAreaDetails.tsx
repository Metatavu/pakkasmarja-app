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
};

export default class ContractAreaDetails extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  /**
   * Get area details row
   */
  private renderAreaDetailsRow = (index: number, name?: string, size?: number, species?: string) => {
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
      </Row>
    );
  }

  componentDidMount = () => {
    console.log(this.props.areaDetailValues);
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
      console.log("JOOO", areaDetails);
      this.props.onUserInputChange("areaDetailValues", areaDetails);
    } else {
      console.log("JAA", areaDetails);
      areaDetails[index][key] = value;
      this.props.onUserInputChange("areaDetailValues", areaDetails);
    }
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

  public render() {
    return (
      <View style={this.props.styles.BlueContentView}>
        <Text style={this.props.styles.ContentHeader}>Tuotannossa olevat hehtaarit</Text>
        <Grid>
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
          </Row>
          {
            this.props.areaDetailValues && this.props.areaDetailValues.length > 0 && this.props.areaDetailValues.map((areaDetail, index) => {
              return (
                this.renderAreaDetailsRow(index, areaDetail.name, areaDetail.size, areaDetail.species)
              );
            })
          }
          {
            (!this.props.areaDetailValues || this.props.areaDetailValues.length <= 0) && !this.props.isActiveContract && 
              this.renderAreaDetailsRow(0)
          }
        </Grid>
      </View>
    );
  }
}