const ADDRESS_CHANGED = "ADDRESS_CHANGED";
const ID_CHANGED = "ID_CHANGED";
const TOKEN_ID_CHANGED = "TOKEN_ID_CHANGED";

interface action {
  type: string;
  [key: string]: any;
}

export interface contractState {
  contractAddress: string;
  id: string;
  tokenIds: number[];
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

export const changeTokenIds = (ids: number[]) => {
  return {
    type: TOKEN_ID_CHANGED,
    ids
  }
}

const initialState = {
  contractAddress: "0xE09e27a371C3a5e36cc52835baf797f053924171",
  id: "",
  tokenIds: []
};

const reducer = (state: contractState = initialState, action: action): contractState => {
  switch (action.type) {
    case ADDRESS_CHANGED:
      return { ...state, contractAddress: action.address };

    case ID_CHANGED:
      return { ...state, id: action.id };

    case TOKEN_ID_CHANGED:
      return {...state, tokenIds: action.ids}

    default:
      return state;
  }
};

export default reducer;
