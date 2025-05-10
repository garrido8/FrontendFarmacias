export interface Farmacia {
  _id:                              string;
  uri:                              string;
  geo_long:                         number;
  geo_lat:                          number;
  schema_name:                      string;
  schema_telephone:                 string;
  schema_description:               string;
  om_situadoEnVia:                  string;
  schema_fax:                       string;
  schema_address:                   string;
  schema_address_addressLocality:   SchemaAddressAddressLocality;
  schema_address_postalCode:        number;
  Horario_de_manana_Opens:          HorarioOpens;
  Horario_de_manana_Closes:         HorarioDeMananaCloses;
  Horario_de_tarde_invierno_Opens:  HorarioDeTardeInviernoOpens;
  Horario_de_tarde_invierno_Closes: HorarioDeTardeInviernoCloses;
  Horario_de_tarde_verano_Opens:    HorarioDeTardeVeranoOpens;
  Horario_de_tarde_verano_Closes:   HorarioDeTardeVeranoCloses;
  Horario_Extendido_Opens:          HorarioOpens;
  Horario_Extendido_Closes:         HorarioExtendidoCloses;
  Descripcion_Horario:              string;
  tieneEnlaceSIG:                   string;
  __v:                              number;
}

export enum HorarioExtendidoCloses {
  Empty = " ",
  The2200 = "22:00 ",
  The2400 = "24:00 ",
}

export enum HorarioOpens {
  Empty = " ",
  The0000 = "00:00 ",
  The930 = "9:30 ",
}

export enum HorarioDeMananaCloses {
  Empty = " ",
  The1400 = "14:00 ",
}

export enum HorarioDeTardeInviernoCloses {
  Empty = " ",
  The2000 = "20:00 ",
}

export enum HorarioDeTardeInviernoOpens {
  Empty = " ",
  The1700 = "17:00 ",
}

export enum HorarioDeTardeVeranoCloses {
  Empty = " ",
  The2030 = "20:30 ",
}

export enum HorarioDeTardeVeranoOpens {
  Empty = " ",
  The1730 = "17:30 ",
}

export enum SchemaAddressAddressLocality {
  Caceres = "Caceres ",
}
