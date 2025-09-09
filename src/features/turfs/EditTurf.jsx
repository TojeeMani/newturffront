import React from 'react';
import { useParams } from 'react-router-dom';
import AddTurf from './AddTurf';

// Dedicated edit page that embeds the editor in edit mode
const EditTurf = () => {
  const { id } = useParams();
  return <AddTurf editTurfId={id} forceEdit={true} />;
};

export default EditTurf;


