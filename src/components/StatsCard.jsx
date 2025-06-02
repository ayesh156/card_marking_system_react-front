// src/components/StatsCard.jsx

import React from 'react';
import { Box, Typography, Paper, Avatar, useTheme } from '@mui/material';
import { tokens } from "../theme";

const StatsCard = ({ title, value, subtext, icon, color }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Paper 
      sx={{ 
        p: 2, 
        bgcolor: colors.primary[400],
        borderRadius: 1,
        boxShadow: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5">
            {title}
          </Typography>
          <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
            {value}
          </Typography>
        </Box>
        <Avatar 
          sx={{ 
            bgcolor: 'transparent', 
            border: `2px solid ${color}`,
            color: color,
            width: 40, 
            height: 40 
          }}
        >
          {icon}
        </Avatar>
      </Box>
      <Typography variant="caption" sx={{ color: color, fontSize: 12, textAlign: 'right' }}>
        {subtext}
      </Typography>
    </Paper>
  );
};

export default StatsCard;