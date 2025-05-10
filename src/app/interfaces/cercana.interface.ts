export interface Cercana {
  farmacia:     Farmacia;
  distancia_km: string;
}

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
  schema_address_addressLocality:   string;
  schema_address_postalCode:        number;
  Horario_de_manana_Opens:          string;
  Horario_de_manana_Closes:         string;
  Horario_de_tarde_invierno_Opens:  string;
  Horario_de_tarde_invierno_Closes: string;
  Horario_de_tarde_verano_Opens:    string;
  Horario_de_tarde_verano_Closes:   string;
  Horario_Extendido_Opens:          string;
  Horario_Extendido_Closes:         string;
  Descripcion_Horario:              string;
  tieneEnlaceSIG:                   string;
  __v:                              number;
}
