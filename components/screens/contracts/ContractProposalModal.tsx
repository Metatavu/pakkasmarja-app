import React from "react";
import { Text } from "native-base";
import { View, TouchableOpacity, StyleSheet, Picker, TextInput } from "react-native";
import Modal from "react-native-modal";
import { ItemGroup } from "pakkasmarja-client";

/**
 * Interface for component props
 */
interface Props {
  modalOpen: boolean,
  closeModal: () => void,
  itemGroups: ItemGroup[],
  selectedBerry: string,
  onSelectedBerryChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onQuantityCommentChange: (value: string) => void;
  sendContractProposalClicked: (type: string) => void;
  quantity: string,
  quantityComment: string,
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
};

export default class ContractProposalModal extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      modalOpen: false
    };
  }

  /**
   * Close modal
   */
  private closeModal = () => {
    this.props.closeModal();
  }

  /**
   * Render method for contract modal component
   */
  public render() {
    const styles = StyleSheet.create({
      BlueContentView: {
        padding: 15,
        backgroundColor: "#fff",
        paddingBottom: 20,
        marginBottom: 15
      },
      headerRow: {
        paddingBottom: 20,
        marginBottom: 10,
        borderBottomColor: "#000000",
        borderBottomWidth: 1
      },
      row: {
        paddingBottom: 5,
        paddingTop: 5,
      },
      modalButton: {
        width: "100%",
        height: 40,
        backgroundColor: "#e01e36",
        justifyContent: "center",
        alignItems: "center",
      },
      buttonText:{
        color:"white",
        fontWeight:"bold",
        fontSize:26
      }
    });
    return (
      <View style={{ marginTop: 22 }}>
        <Modal isVisible={this.props.modalOpen} style={{ height: "80%" }}>
          <View style={styles.BlueContentView}>
            <View>
              <Text>
                Ehdota sopimusta jostain muusta marjasta
              </Text>
            </View>
            <View>
              <Picker
                selectedValue={this.props.selectedBerry}
                style={{height:50,width:"100%", color:"black"}}
                onValueChange={(itemValue, itemIndex) =>
                  this.props.onSelectedBerryChange(itemValue)
                }>
                {
                  this.props.itemGroups.map((itemGroup) => {
                    return (
                      <Picker.Item key={itemGroup.id} label={itemGroup.name || ""} value={itemGroup.id} />
                    );
                  })
                }
              </Picker>
            </View>
            <View>
              <Text>Määrä</Text>
              <TextInput 
                keyboardType="numeric"
                value={this.props.quantity}
                onChangeText={(text: string) => this.props.onQuantityChange(text)}
              />
            </View>
            <View>
              <Text>Kommentti</Text>
              <TextInput 
                multiline = {true}
                numberOfLines = {4}
                value={this.props.quantityComment}
                onChangeText={(text:string) => this.props.onQuantityCommentChange(text)}
              />
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={this.props.sendContractProposalClicked}>
              <Text style={styles.buttonText}>Lähetä</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={this.closeModal}>
              <Text style={styles.buttonText}>Sulje</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }
}