export const TABLE_KEYS = {
  g_1: "테이블1",
  g_2: "테이블2", 
  g_3: "테이블3",
  g_4: "테이블4",
  g_5: "테이블5",
  g_6: "테이블6",
  g_7: "테이블7",
  g_8: "테이블8",
  wait: "대기",
  eat: "식사",
  rest: "휴식",
};

export const TABLE_STATUS_COLORS = {
  g_1: "bg-green-100 text-green-800 border-green-200",
  g_2: "bg-green-100 text-green-800 border-green-200",
  g_3: "bg-green-100 text-green-800 border-green-200",
  g_4: "bg-green-100 text-green-800 border-green-200", 
  g_5: "bg-green-100 text-green-800 border-green-200",
  g_6: "bg-green-100 text-green-800 border-green-200",
  g_7: "bg-green-100 text-green-800 border-green-200",
  g_8: "bg-green-100 text-green-800 border-green-200",
  wait: "bg-yellow-100 text-yellow-800 border-yellow-200",
  eat: "bg-orange-100 text-orange-800 border-orange-200", 
  rest: "bg-blue-100 text-blue-800 border-blue-200",
};

export const getTableStatusLabel = (status) => {
  return TABLE_KEYS[status] || status;
};

export const getTableStatusColor = (status) => {
  return TABLE_STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200";
};