import { StyleSheet } from "react-native";

/**
 * Styles
 */
export const styles = StyleSheet.create({

  tab: {
    backgroundColor: "#E51D2A"
  },
  activeTab: {
    color: "#000000",
    fontWeight: "bold"
  },
  pickerWrap: {
    height: 50,
    backgroundColor: '#fafafa',
    borderColor: "#e01e36",
    borderWidth: 1,
    borderRadius: 8
  },
  deliveriesButton: {
    backgroundColor: "#e01e36",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7
  },
  begindeliveryButton: {
    backgroundColor: "#42AD18",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7
  },
  loaderContainer: {
    paddingTop: 30
  },
  textWithSpace: {
    paddingTop: 7,
    paddingBottom: 7
  },
  flexView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  contentHeader: {
    fontWeight: "bold",
    fontSize: 25,
    paddingBottom: 20
  },
  text: {
    fontSize: 20,
    paddingTop: 7,
    paddingBottom: 7
  },
  smallRedButton: {
    width: "47%",
    height: 50,
    backgroundColor: "#e01e36",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    borderRadius: 7
  },
  buttonText: {
    color: '#f2f2f2',
    fontWeight: "700"
  },
  smallWhiteButton: {
    width: "47%",
    height: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderColor: "#e01e36",
    borderWidth: 2,
    borderRadius: 7
  },
  smallWhiteButtonText: {
    color: "#e01e36",
    fontWeight: "600"
  },
  textInput: {
    backgroundColor: "white",
    borderColor: "#e01e36",
    borderWidth: 2,
    borderRadius: 4,
  },
  listItemTitle: {
    fontWeight: "bold",
    fontSize: 18
  },
  listContainerStyle: {
    marginBottom: 20,
    marginTop: 50,
    borderTopColor: 'transparent'
  },
  listItemContainerStyle: {
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    paddingVertical: 5,
    marginVertical: 10
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  topViewWithButton: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderBottomColor: 'lightgray',
    borderBottomWidth: 0.5
  },
  red: {
    color: "#e01e36"
  },
  lightRedBackGroundColor: {
    backgroundColor: "#FFD5CC"
  },
  green: {
    color: "#42AD18"
  },
  renderCustomListItem: {
    flex: 1,
    flexDirection: "row",
    padding: 15,
    borderBottomColor: 'lightgray',
    borderBottomWidth: 1
  },
  textPrediction: {
    color: "black",
    fontSize: 16,
  }
});