const ADDRESS_CHANGED = "ADDRESS_CHANGED";
const ID_CHANGED = "ID_CHANGED";

interface action {
  type: string;
  [key: string]: any;
}

export interface contractState {
  contractAddress: string;
  id: string;
}

export const changeAddress = (address: string) => {
  return {
    type: ADDRESS_CHANGED,
    address,
  };
};

export const changeId = (id: string) => {
  return {
    type: ID_CHANGED,
    id,
  };
};

const initialState = {
  contractAddress: "0x9027b5f491496Fa658D534b82F61Aa7df05d1a68",
  id: "",
};

const reducer = (state: contractState = initialState, action: action): contractState => {
  switch (action.type) {
    case ADDRESS_CHANGED:
      return { ...state, contractAddress: action.address };

    case ID_CHANGED:
      return { ...state, id: action.id };

    default:
      return state;
  }
};

export default reducer;
