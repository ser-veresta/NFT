import { createStore, combineReducers } from "redux";
import contractReducer from "./Contract";

const reducer = combineReducers({
  contractReducer,
});

const configureStore = (initialState?: any) => createStore(reducer, initialState);

export default configureStore;
